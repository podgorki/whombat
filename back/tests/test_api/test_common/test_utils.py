import unittest
from unittest.mock import patch, MagicMock

class TestBatchedImport(unittest.TestCase):

    @patch('sys.version_info', (3, 12))
    @patch.dict('sys.modules', {'more_itertools': None})
    def test_import_itertools_batched(self):
        """Test importing 'batched' from 'itertools' in Python 3.12+."""
        import importlib
        import batched_import
        importlib.reload(batched_import)  # Reload to apply patched version_info
        from itertools import batched
        self.assertIs(batched_import.batched, batched)

    @patch('sys.version_info', (3, 11))
    @patch.dict('sys.modules', {'more_itertools': MagicMock()})
    def test_import_more_itertools_batched(self):
        """Test importing 'batched' from 'more_itertools' in Python 3.11 with package available."""
        import importlib
        import batched_import
        importlib.reload(batched_import)  # Reload to apply patched version_info
        from more_itertools import batched
        self.assertIs(batched_import.batched, batched)

    @patch('sys.version_info', (3, 11))
    @patch.dict('sys.modules', {'more_itertools': None})
    def test_import_error_when_more_itertools_missing(self):
        """Test ImportError is raised in Python 3.11 when 'more-itertools' is not available."""
        import importlib
        with self.assertRaises(ImportError):
            import batched_import
            importlib.reload(batched_import)  # Reload to apply patched version_info

if __name__ == '__main__':
    unittest.main()