require('dotenv').config();

function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    secret: required('SECRET'),
    sessionSecret: required('SESSION_SECRET'),
    port: Number(process.env.PORT || 3000),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    corsOrigins: (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
    db: {
        dbUrl: isProduction ? required('DB_URL') : process.env.DB_URL || 'mongodb://127.0.0.1:27017',
        dbName: isProduction ? required('DB_NAME') : process.env.DB_NAME || 'home-decor',
        dbHost: 'localhost',
        dbPort: 27017,
    },
    deliveryCost: 10,
    deliveryTypes: {delivery: 'delivery', self: 'self'},
    paymentTypes: {cashToCourier: 'cashToCourier', cardOnline: 'cardOnline', cardToCourier: 'cardToCourier'},
    statuses: {new: 'new', pending: 'pending', delivery: 'delivery', cancelled: 'cancelled', success: 'success'}
};

module.exports = config;