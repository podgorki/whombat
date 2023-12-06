"""Base API interface."""

from abc import ABC
from typing import Any, Callable, Generic, Hashable, Sequence, TypeVar

import cachetools
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql._typing import _ColumnExpressionArgument
from sqlalchemy.sql.expression import ColumnElement

from whombat import models
from whombat.api.common.utils import (
    create_object,
    create_objects,
    create_objects_without_duplicates,
    delete_object,
    get_object,
    get_objects,
    update_object,
)
from whombat.filters.base import Filter

WhombatModel = TypeVar("WhombatModel", bound=models.Base)
WhombatSchema = TypeVar("WhombatSchema", bound=BaseModel)
CreateSchema = TypeVar("CreateSchema", bound=BaseModel)
UpdateSchema = TypeVar("UpdateSchema", bound=BaseModel)
PrimaryKey = TypeVar("PrimaryKey", bound=Hashable)


class BaseAPI(
    ABC,
    Generic[
        PrimaryKey,
        WhombatModel,
        WhombatSchema,
        CreateSchema,
        UpdateSchema,
    ],
):
    _schema: type[WhombatSchema]
    _model: type[WhombatModel]
    _cache: cachetools.LRUCache

    def __init__(self):
        self._cache = cachetools.LRUCache(maxsize=1000)

    async def get(
        self,
        session: AsyncSession,
        pk: PrimaryKey,
    ) -> WhombatSchema:
        """Get an object by primary key.

        Parameters
        ----------
        session
            The database session to use.
        pk
            The primary key.

        Returns
        -------
        obj
            The object with the given primary key.

        Raises
        ------
        NotFoundError
            If the object could not be found.
        """
        if pk in self._cache:
            return self._cache[pk]

        obj = await get_object(
            session,
            self._model,
            self._get_pk_condition(pk),
        )
        data = self._schema.model_validate(obj)
        self._cache[pk] = data
        return data

    async def get_many(
        self,
        session: AsyncSession,
        *,
        limit: int | None = 1000,
        offset: int | None = 0,
        filters: Sequence[Filter | _ColumnExpressionArgument] | None = None,
        sort_by: _ColumnExpressionArgument | str | None = None,
    ) -> tuple[Sequence[WhombatSchema], int]:
        """Get many objects.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        limit
            The maximum number of objects to return, by default 1000
        offset
            The offset to use, by default 0
        filters
            A list of filters to apply, by default None
        sort_by
            The column to sort by, by default None

        Returns
        -------
        objs
            The objects.
        count : int
            The total number of objects. This is the number of objects that
            would have been returned if no limit or offset was applied.
        """
        objs, count = await get_objects(
            session,
            self._model,
            limit=limit,
            offset=offset,
            filters=filters,
            sort_by=sort_by,
        )
        return [self._schema.model_validate(obj) for obj in objs], count

    async def create(
        self,
        session: AsyncSession,
        data: CreateSchema,
    ) -> WhombatSchema:
        """Create an object.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        data
            The data to use for creation of the object.

        Returns
        -------
        WhombatSchema
            The created object.
        """
        db_obj = await create_object(session, self._model, data)
        obj = self._schema.model_validate(db_obj)
        self._cache[self._get_pk_from_obj(obj)] = obj
        return obj

    async def create_many(
        self,
        session: AsyncSession,
        data: Sequence[CreateSchema],
    ) -> None:
        """Create many objects.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        data
            The data to use for creation of the objects.
        """
        await create_objects(session, self._model, data)

    async def create_many_without_duplicates(
        self,
        session: AsyncSession,
        data: Sequence[CreateSchema],
        return_all: bool = False,
    ) -> Sequence[WhombatSchema]:
        """Create many objects.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        data
            The data to use for creation of the objects.
        return_all
            Whether to return all objects, or only those created.

        Returns
        -------
        objs
            Will only return the created objects, not the existing ones.
        """
        key_column = self._get_key_column()
        objs = await create_objects_without_duplicates(
            session,
            self._model,
            data,
            self._key_fn,
            key_column,
            return_all=return_all,
        )
        return [self._schema.model_validate(obj) for obj in objs]

    async def delete(
        self,
        session: AsyncSession,
        obj: WhombatSchema,
    ) -> WhombatSchema:
        """Delete an object.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        obj
            The object to delete.

        Returns
        -------
        obj
            The deleted object.
        """
        pk = self._get_pk_from_obj(obj)
        deleted = await delete_object(
            session,
            self._model,
            self._get_pk_condition(pk),
        )
        del self._cache[pk]
        return self._schema.model_validate(deleted)

    async def update(
        self,
        session: AsyncSession,
        obj: WhombatSchema,
        data: UpdateSchema,
    ) -> WhombatSchema:
        """Update an object.

        Parameters
        ----------
        session
            The SQLAlchemy AsyncSession of the database to use.
        obj
            The object to update.
        data
            The data to use for update.

        Returns
        -------
        WhombatSchema
            The updated object.
        """
        pk = self._get_pk_from_obj(obj)
        updated = await update_object(
            session,
            self._model,
            self._get_pk_condition(pk),
            data,
        )
        obj = self._schema.model_validate(updated)
        self._cache[pk] = obj
        return obj

    def _update_cache(self, obj: WhombatSchema) -> None:
        """Update the cache.

        Parameters
        ----------
        obj
            The object to update the cache with.
        """
        pk = self._get_pk_from_obj(obj)
        self._cache[pk] = obj

    def _get_pk_condition(self, pk: PrimaryKey) -> _ColumnExpressionArgument:
        column = getattr(self._model, "uuid")
        if not column:
            raise NotImplementedError(
                f"The model {self._model.__name__} does not have a column named"
                " uuid"
            )
        return column == pk

    def _get_pk_from_obj(self, obj: WhombatSchema) -> PrimaryKey:
        pk = getattr(obj, "uuid")
        if not pk:
            raise NotImplementedError(
                "The primary key could not be retrieved from the object. "
                "The implementation of this method is likely missing."
            )
        return pk

    @classmethod
    def _key_fn(cls, obj: WhombatModel | CreateSchema) -> Any:
        """Get a key from an object.

        This key is used to determine whether an object already exists in the
        database when the primary key is not known. This key is used
        internally by the API when creating multiple objects at once,
        as trying to insert an object that already exists in the database
        will result in an error.

        Parameters
        ----------
        obj
            The object to get the key from.

        Returns
        -------
        Any
            The key.
        """
        raise NotImplementedError

    @classmethod
    def _get_key_column(cls) -> ColumnElement | InstrumentedAttribute:
        """Get a key column.

        Returns
        -------
        ColumnElement | InstrumentedAttribute
            The key column.
        """
        raise NotImplementedError
