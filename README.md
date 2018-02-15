# tracker-api

make sure that redis server is runing at localhost:6379 (127.0.0.1:6379) before you start app.

## app scripts
`npm run dev` - run nodemon server

`npm run test` - run mocha unit tests

`nmp run loadTest` - run performance test



## author note
I am not sure if nodemon, concurrently and artillery modules require npm global install. If you run into troubles, please, try install them locally

`npm i -g nodemon concurrently artillery`
