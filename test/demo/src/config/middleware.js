const path = require('path');
const isDev = think.env === 'development';
const thinkJoiRouterDocsMiddleware = require('../../../../index');

module.exports = [
    {
        handle: 'meta',
        options: {
            logRequest: isDev,
            sendResponseTime: isDev
        }
    },
    {
        handle: 'resource',
        enable: isDev,
        options: {
            root: path.join(think.ROOT_PATH, 'www'),
            publicPath: /^\/(static|favicon\.ico)/
        }
    },
    {
        handle: 'trace',
        enable: !think.isCli,
        options: {
            debug: isDev
        }
    },
    {
        handle: 'payload',
        options: {}
    },
    {
        handle: thinkJoiRouterDocsMiddleware,
        options: {
            showDocs: true,
            docPath: '/api_docs',
            docSpec: {
                info: {
                    title: 'Example API',
                    description: 'API for creating and editing examples.',
                    version: '1.1'
                },
                basePath: '/',
                tags: [{
                    name: 'users',
                    description: `A User represents a person who can login 
      and take actions subject to their granted permissions.`
                }],
            },
        },
    },
    'controller',
];
