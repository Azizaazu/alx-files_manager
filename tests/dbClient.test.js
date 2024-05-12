import unittest
from your_project import dbClient

class TestDBClient(unittest.TestCase):
    def setUp(self):
        self.db = dbClient.DBClient()

    def test_insert_and_retrieve(self):
        data = {'id': 1, 'name': 'John'}
        self.db.insert(data)
        retrieved_data = self.db.retrieve(1)
        self.assertEqual(retrieved_data, data)

    def test_update(self):
        data = {'id': 1, 'name': 'John'}
        self.db.insert(data)
        updated_data = {'id': 1, 'name': 'Jane'}
        self.db.update(updated_data)
        retrieved_data = self.db.retrieve(1)
        self.assertEqual(retrieved_data['name'], 'Jane')

if __name__ == '__main__':
    unittest.main()
