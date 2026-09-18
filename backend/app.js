const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoStore } = require('connect-mongo');
const categoryRoutes = require('./src/routes/category.routes');
const typeRoutes = require('./src/routes/type.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/cart.routes');
const authRoutes = require('./src/routes/auth.routes');
const favoriteRoutes = require('./src/routes/favorite.routes');
const orderRoutes = require('./src/routes/order.routes');
const userRoutes = require('./src/routes/user.routes');
const MongoDBConnection = require('./src/utils/common/connection');
const config = require('./src/config/config');
const session = require('express-session');
const path = require('path');
const {v4: uuidv4} = require('uuid');
const passport = require('passport');
const UserModel = require('./src/models/user.model');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

MongoDBConnection.getConnection((error, connection) => {
    if (error || !connection) {
        console.log('Db connection error', error);
        return;
    }

    const app = express();

    app.set('trust proxy', 1);

    app.use(helmet({
        crossOriginResourcePolicy: {policy: 'cross-origin'},
    }));

    app.use(cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin || config.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
    }));

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {error: true, message: 'Слишком много попыток. Попробуйте позже'},
    });

    app.use('/api/login', authLimiter);
    app.use('/api/signup', authLimiter);

    app.use(session({
        genid: function () {
            return uuidv4();
        },
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: config.db.dbUrl,
            dbName: config.db.dbName,
            collectionName: 'sessions',
        }),
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: config.cookieSecure,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
    }));

    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromHeader('x-access-token'),
        secretOrKey: config.secret,
        algorithms: ['HS256'],
    }, async (payload, next) => {
        if (!payload.id) {
            return next(new Error('Не валидный токен'));
        }

        let user = null;
        try {
            user = await UserModel.findOne({_id: payload.id});
        } catch (e) {
            console.log(e);
        }

        if (user) {
            return next(null, payload);
        }

        next(new Error('Пользователь не найден'));
    }));

    app.use(passport.initialize());

    app.use('/api', authRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/types', typeRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/favorites', favoriteRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/user', userRoutes);

    app.use(function (req, res, next) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    app.use(function (err, req, res, next) {
        res.status(err.statusCode || 500).send({error: true, message: err.message});
    });

    app.listen(config.port, () =>
        console.log(`Server started on port ${config.port}`)
    );
});