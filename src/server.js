const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const costumers = [];

//middleware
function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const costumer = costumers.find((costumer) => costumer.cpf === cpf)

    if (!costumer) {
        return res.status(400).json({ error: 'costumer not found' })
    }

    req.costumer = costumer;

    return next()
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)

    return balance
}


app.post('/account', (req, res) => {
    const { cpf, name } = req.body

    const costumerAlreadyExists = costumers.some(
        (costumer) => costumer.cpf === cpf
    )

    if (costumerAlreadyExists) {
        res.status(400).json({ error: 'costumer already exists' })
    }


    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).send()
})

// app.use(verifyIfExistsAccountCPF)

app.get('/statement/', verifyIfExistsAccountCPF, (req, res) => {
    const { costumer } = req;
    return res.json(costumer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body

    const { costumer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    costumer.statement.push(statementOperation)

    return res.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body
    const { costumer } = req

    const balance = getBalance(costumer.statement)

    if (balance < amount) {
        return res.status(400).json({ error: 'insufficient funds' })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    costumer.statement.push(statementOperation)

    return res.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
    const { costumer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = costumer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement)
})

app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body
    const { costumer } = req

    costumer.name = name

    return res.status(201).send()
})

app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { costumer } = req

    return res.json(costumer)
})

app.delete('/delete', verifyIfExistsAccountCPF, (req, res) => {
    const { costumer } = req

    costumers.splice(costumer, 1)

    return res.status(200).json(costumers)
})

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {   
    const { costumer } = req

    const balance = getBalance(costumer.statement);

    return res.json(balance)
})

app.listen(3333)