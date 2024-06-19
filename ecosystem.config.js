module.exports = {
    apps: [
        {
            name: 'hamburgueseria',
            script: 'app.js',
            env: {
                NODE_ENV: 'development',
                PORT: 3030,
                MONGO_URI: 'mongodb://localhost:27017/burger'
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3030,
                MONGO_URI: 'mongodb://localhost:27017/burger'
            }
        }
    ]
};