import unittest
from your_project import redisClient

class TestRedisClient(unittest.TestCase):
    def setUp(self):
        self.redis = redisClient.RedisClient()

    def test_set_get(self):
        self.redis.set('test_key', 'test_value')
        self.assertEqual(self.redis.get('test_key'), 'test_value')

    def test_delete(self):
        self.redis.set('test_key', 'test_value')
        self.redis.delete('test_key')
        self.assertIsNone(self.redis.get('test_key'))

if __name__ == '__main__':
    unittest.main()
