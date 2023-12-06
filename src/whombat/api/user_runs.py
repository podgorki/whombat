from typing import Sequence
from uuid import UUID

from soundevent import data
from sqlalchemy.ext.asyncio import AsyncSession

from whombat import exceptions, models, schemas
from whombat.api import clip_predictions, users
from whombat.api.common import BaseAPI, create_object
from whombat.filters.base import Filter
from whombat.filters.clip_predictions import UserRunFilter


class UserRunAPI(
    BaseAPI[
        UUID,
        models.UserRun,
        schemas.UserRun,
        schemas.UserRunCreate,
        schemas.UserRunUpdate,
    ]
):
    _model = models.UserRun
    _schema = schemas.UserRun

    async def get_clip_predictions(
        self,
        session: AsyncSession,
        obj: schemas.UserRun,
        *,
        limit: int | None = 1000,
        offset: int = 0,
        filters: Sequence[Filter] | None = None,
        sort_by: str | None = None,
    ) -> tuple[list[schemas.ClipPrediction], int]:
        return await clip_predictions.get_many(
            session,
            limit=limit,
            offset=offset,
            filters=[
                UserRunFilter(eq=obj.id),
                *(filters or []),
            ],
            sort_by=sort_by,
        )

    async def add_clip_prediction(
        self,
        session: AsyncSession,
        obj: schemas.UserRun,
        clip_prediction: schemas.ClipPrediction,
        raise_if_exists: bool = False,
    ) -> schemas.UserRun:
        try:
            await create_object(
                session,
                models.UserRunPrediction,
                schemas.UserRunPredictionCreate(
                    user_run_id=obj.id,
                    clip_prediction_id=clip_prediction.id,
                ),
            )
        except exceptions.DuplicateObjectError as err:
            if raise_if_exists:
                raise err
        return obj

    async def update_from_soundevent(
        self,
        session: AsyncSession,
        obj: schemas.UserRun,
        data: data.PredictionSet,
    ) -> schemas.UserRun:
        for clip_prediction in data.clip_predictions:
            prediction = await clip_predictions.from_soundevent(
                session,
                clip_prediction,
            )
            obj = await self.add_clip_prediction(session, obj, prediction)
        return obj

    async def from_soundevent(
        self,
        session: AsyncSession,
        data: data.PredictionSet,
        user: data.User,
    ) -> schemas.UserRun:
        whombat_user = await users.from_soundevent(session, user)

        try:
            model_run = await self.get(session, data.uuid)
        except exceptions.NotFoundError:
            model_run = await self.create(
                session,
                schemas.UserRunCreate(
                    uuid=data.uuid,
                    created_on=data.created_on,
                    user_id=whombat_user.id,
                ),
            )
        return await self.update_from_soundevent(session, model_run, data)

    async def to_soundevent(
        self, session: AsyncSession, obj: schemas.UserRun
    ) -> data.PredictionSet:
        predictions, _ = await self.get_clip_predictions(
            session, obj, limit=-1
        )
        return data.PredictionSet(
            uuid=obj.uuid,
            created_on=obj.created_on,
            clip_predictions=[
                clip_predictions.to_soundevent(cp) for cp in predictions
            ],
        )


user_runs = UserRunAPI()
