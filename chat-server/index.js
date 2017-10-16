"use strict"

// Copyright (c) 2017 Tri R.A. Wibowo

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const db = require('mysql-promise')()
const moment = require('moment')

const db_config = {
    "host": "localhost",
    "user": "tri",
	"password": "#4m4l14#",
	"database": "faveo"
}

//const client_list = new Map()

// Initializing MySQL connection with built-in Promise implementation instead of the default one i.e. BlueBird
db.configure(db_config, null, Promise)

function show_error(err) {
    console.trace(err)
}

function retrieve_chat_history(sender_id, recipient_id, cb)
{
    const query = `SELECT first_name, last_name, date, time, text, ${recipient_id} recipient_id FROM chat_history h JOIN users u ON h.sender_id = u.id WHERE sender_id = ${sender_id} AND recipient_id = ${recipient_id} UNION ALL SELECT first_name, last_name, date, time, text, ${sender_id} recipient_id FROM chat_history h JOIN users u ON h.sender_id = u.id WHERE recipient_id = ${sender_id} AND sender_id = ${recipient_id} ORDER BY date DESC, time DESC`
    //const query = `SELECT s.first_name, s.last_name, date, time, text FROM chat_history h JOIN (SELECT id, first_name, last_name FROM users WHERE id = ${sender_id} OR id = ${recipient_id}) s ON h.sender_id = s.id JOIN (SELECT id, first_name, last_name FROM users WHERE id = ${sender_id} OR id = ${recipient_id}) r ON h.recipient_id = r.id WHERE sender_id = ${sender_id} AND recipient_id = ${recipient_id} ORDER BY date DESC, time DESC`
    //console.log(query)

    db.query(query).then(result => { console.log('x',result[0]);cb(result[0]) }).catch(show_error)
    //[{date:'2017-10-23', time:'', text:'Cuy, jadi ga?', sender_id:1, recipient_id:3, first_name:'Johan',last_name:'Malhotra'}]
}

function unhandledRejection(reason, p)
{
  console.log(`Possibly Unhandled Rejection at:`)
  console.dir(p)
  console.log(`Reason: ${reason}`)
}

process.on('unhandledRejection', unhandledRejection)

// Testing if a user is connected via WebSocket
io.on('connection', socket => {
    console.log(`User ${socket.id} is connected`)

    socket.on('join', (data, cb) => {
        try
        {
            // Updating client list (insert new user's socket ID or replace it with new socket ID)
            // OBSOLETE : client_list.set(data.user_id, socket.id)
            const query = `INSERT INTO contact_list (user_id, socket_id, status) VALUES (${data.user_id}, '${socket.id}', 'online') ON DUPLICATE KEY UPDATE socket_id = '${socket.id}'`

            db.query(query).then(result =>
            {
                console.log(`${socket.id} has joined`)
                console.log(result)

                cb(true)
                //cb(result[0])
            })
        }

        catch(err)
        {
            console.trace(err)
            console.log(`${socket.id} has FAILED to join`)
            cb(false)
            //cb(new Error(`${socket.id} has FAILED to join`))
        }
    })

    socket.on('retrieve_contacts', (data, cb) => {
        try {
            // Proceed to retrieve contacts and send them via callback
            /*const map_keys = client_list.keys()

            let contact_list = []

            for (let a = 0; a < client_list.size; a++) {
                const current_key = map_keys.next().value

                if (current_key !== data.user_id) {
                    contact_list.push(current_key)
                }
            }*/

            const query = `SELECT u.id, first_name, last_name, c.status FROM users u JOIN contact_list c ON u.id = c.user_id`

            db.query(query).then(data => {cb(data[0])})

            /*if (contact_list.length === 0) {
                //return cb([])
                // 0 refers to ID that doesn't exist in the users table
                contact_list.push(0)
            }

            /*const online_contact = `SELECT id, first_name, last_name, 'online' status FROM users WHERE id IN (${contact_list.join()})`
            const offline_contact = `SELECT id, first_name, last_name, 'offline' status FROM users WHERE id NOT IN (${contact_list.join()})`

            const query = `${online_contact} UNION ${offline_contact}`

            db.query(query).then(data => {cb(data[0])})*/
        }

        catch(err) {
            show_error(err)
        }
    })

    socket.on('retrieve_chat_history', (data, cb) => {
        try {
            //make an external func to do the retrieval
            retrieve_chat_history(data.sender_id, data.recipient_id, cb)
            //console.log('retrieve_chat_history')
            //cb([{date:'2017-10-23', text:'Cuy, jadi ga?', sender_id:1, recipient_id:3, first_name:'Johan',last_name:'Malhotra'}])
        }

        catch(err) {
            show_error(err)
        }
    })

    socket.on('send_new_message', (data, cb) => {
        // Retrieve the recipient's socket ID based on the submitted recipient's user ID
        //const socket_id = client_list.get(data.recipient_id)
        const fetch_query = `SELECT socket_id FROM contact_list WHERE user_id = ${data.recipient_id}`
        const retrieve = retrieve_chat_history.bind(null, data.sender_id, data.recipient_id, cb)

        function save_message(result)
        {
            const socket_id = result[0][0].socket_id
            //console.log('x socket_id :', socket_id)

            const query = `INSERT INTO chat_history (sender_id, recipient_id, text, date, time) VALUES (${data.sender_id}, ${data.recipient_id}, '${data.text}', '${moment().format('YYYY-MM-DD')}', '${moment().format('hh:mm:ss')}')`

            return db.query(query).then(() => { return socket_id})
        }

        function forward_message(socket_id)
        {
            console.log('c socket_id :', socket_id)
            //console.log('connected sockets :', io.sockets.connected)
            // This is no longer neccessary
            // DON'T
            //delete data.recipient_id

            // Forward the message to the recipient ONLY after successfully save it to the database
            io.sockets.connected[socket_id].emit('incoming_message', data)

            // After forwarding the message, proceed to retrieve the latest chat history for that particular user
        }

        db.query(fetch_query).then(save_message).then(forward_message).then(retrieve).catch(show_error)
    })
})


// Initializing HTTP connection
http.listen(3000, () => {
  console.log('listening on *:3000')
})

// NOTE : data[0] is RowDataPacket while data[1] is FieldPacket
//db.query('SELECT * FROM users').then(data => {console.log(data[1])})