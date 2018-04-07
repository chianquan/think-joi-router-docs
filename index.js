const _ = require('lodash');
const assert = require('assert');
const koaJoiRouter = require('koa-joi-router');
const {SwaggerAPI} = require('koa-joi-router-docs');
const path = require('path');
const fs = require('fs');
const KoaRouter = require('koa-router');
const koaSend = require('koa-send');
const Joi = koaJoiRouter.Joi;


/**
 * check path is exist
 */
function isExist(dir) {
    dir = path.normalize(dir);
    try {
        fs.accessSync(dir, fs.R_OK);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * check filepath is file
 */
function isFile(filePath) {
    if (!isExist(filePath)) return false;
    try {
        const stat = fs.statSync(filePath);
        return stat.isFile();
    } catch (e) {
        return false;
    }
}

function nextToControllerMiddleware(controller, action) {
    return async function(ctx, next) {
        ctx.controller = controller;
        ctx.action = action;
        return next();
    }
}

module.exports = exports = function(option, app) {
    const showDocs = option.showDocs || false;
    const think = app.think;
    assert(think, 'must mount as a think middleware');
    const APP_PATH = think.APP_PATH;
    const routerConfigFile = path.join(APP_PATH, '/config/router.joi.js');
    if (!isFile((routerConfigFile))) {
        console.log('config/router.joi.js is not exist.ignore');
        return function(ctx, next) {
            return next();
        }
    }
    let routes = require(routerConfigFile);
    assert(_.isArray(routes), 'routers must be array');
    routes = _.map(routes, function(routerOption) {
        routerOption = _.clone(routerOption);
        assert(_.isObject(routerOption), 'router option must be an object');

        const handlers = [];
        if (routerOption.handler) {
            if (_.isArray(routerOption.handler)) {
                for (const mw of routerOption.handler) {
                    handlers.push(mw);
                }
            } else {
                handlers.push()
            }
        }

        if (routerOption.controller) {
            if (!routerOption.action) {
                routerOption.action = 'index';
            }
            const controllerName = routerOption.controller;
            const actionName = routerOption.action;
            handlers.push(nextToControllerMiddleware(controllerName, actionName));
        }
        routerOption.handler = handlers;
        return routerOption;
    });
    const public = koaJoiRouter();
    public.route(routes);
    const router = new KoaRouter();
    router.use(public.middleware());
    router.use(async function(ctx, next) {
        if (ctx.request.body !== undefined) {
            ctx.request.body = {post: ctx.request.body};
        }
        return next();
    });
    if (showDocs) {
        const docRouter = new KoaRouter();

        const docPath = option.docPath || '/apiDocs';
        const generator = new SwaggerAPI();
        generator.addJoiRouter(public);
        const docSpec = option.docSpec || {};
        const spec = generator.generateSpec(docSpec, {
            defaultResponses: {} // Custom default responses if you don't like default 200
        });
        docRouter.get('/_api.json', async ctx => {
            ctx.body = JSON.stringify(spec, null, '  ')
        });
        docRouter.all('*', async function(ctx) {
            if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
                return next();
            }
            try {
                let path = ctx.path && ctx.path.replace(docPath, '');
                if (path === '') {
                    return ctx.response.redirect(ctx.path + '/');
                }
                if (path === '/') {
                    path = '/index.html';
                }
                return koaSend(ctx, path, {
                    root: __dirname + '/static',
                })
            } catch (err) {
                if (err.status !== 404) {
                    throw err
                }
            }
        });
        router.use(docPath, docRouter.routes(), docRouter.allowedMethods());
    }
    return router.routes();
};
exports.Joi = Joi;
