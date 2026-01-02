const request = require('supertest');
const app = require('../app');

describe('Health Check', () => {
    it('should return 200 OK for root (index)', async () => {
        const res = await request(app).get('/');
        if (res.statusCode !== 200) {
            console.error('Root Error:', res.statusCode);
        }
        expect(res.statusCode).toEqual(200);
    });

    it('should return 404 for unknown route', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.statusCode).toEqual(404);
    });
});
