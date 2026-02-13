module.exports = {
    apps: [
        {
            name: 'control-bus-backend',
            script: 'npm',
            args: 'run dev',
            cwd: './',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            }
        },
        {
            name: 'control-bus-frontend',
            script: 'npm',
            args: 'run dev',
            cwd: './frontend',
            env: {
                NODE_ENV: 'development',
                PORT: 3002
            }
        }
    ]
};
