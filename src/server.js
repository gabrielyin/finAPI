const express = require('express')

const app = express()

app.post('/account', (req, res) => {
    const { cpf, name } = req.body
    
})

app.listen(3333)