const Joi = require('../../../../index').Joi;
module.exports = [
    {
        method: 'get',
        path: '/hello/test',
        validate: {
            query: {
                name: Joi.string().only('a', 'b').description('ENUM 参数描述'),
            },
            output: {
                200: {
                    body: {
                        hello: Joi.string(),
                    },
                },
            }
        },
        controller: 'index',
        action: 'test',
    },
];