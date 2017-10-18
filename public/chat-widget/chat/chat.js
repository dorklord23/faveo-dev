// Copyright (c) 2017 Tri R.A. Wibowo

(function() {
    "use strict"

    const style = {
        position : 'relative',
        height : '100%',
        'max-height' : '100%',
        width : '100%',
        'max-width' : '100%',
        'background-color' : 'linen',
        'z-index' : 1
    }

    const script = document.getElementById('chat-widget')
    const user_id = parseInt(script.dataset.user_id)
    const avatar = script.dataset.avatar

    const room = new Promise(join_room)

    let unread_msg = 0
    let notification = {}

    function show_error(err) {
        console.trace(err)
    }

    function notify_user(options, sender_name, title = 'You have a new message from ')
    {
        // Initializing notification
        if (("Notification" in window))
        {
            if (Notification.permission === "granted")
            {
                // If it's okay let's create a notification
                notification = new Notification(title + ' ' + sender_name, options)
            }

            // Otherwise, we need to ask the user for permission
            else if (Notification.permission !== "denied")
            {
                Notification.requestPermission((permission) =>
                {
                    // If the user accepts, let's create a notification
                    if (permission === "granted")
                    {
                        notification = new Notification(title + ' ' + sender_name, options)
                    }
                })
            }
        }

        else
        {
            console.log("This browser doesn't support desktop notification")
        }
    }

    function join_room(resolve, reject) {
        socket.emit('join', {user_id : user_id}, (is_connected) => {
            if (is_connected) {
                resolve(is_connected)
            }

            else {
                reject(new Error('Failed to join room'))
            }
        })
    }

    function retrieve_contacts(is_connected) {
        function fill_contact_list(contacts) {
            let online_contacts = []
            let offline_contacts = []

            for (let a = 0; a < contacts.length; a++) {
                if (contacts[a].status === 'online') {
                    online_contacts.push(`<li><a href="#" class="contact-item ${contacts[a].status}" data-user_id="${contacts[a].id}"><div>${contacts[a].first_name} ${contacts[a].last_name}</div></a></li>`)
                }

                else {
                    offline_contacts.push(`<li><a href="#" class="contact-item ${contacts[a].status}" data-user_id="${contacts[a].id}"><div>${contacts[a].first_name} ${contacts[a].last_name}</div></a></li>`)
                }
            }

            // Reset the contact list
            $('#contact-list').replaceWith('<ul id="contact-list"><li id="online-contacts">ONLINE</li><li id="offline-contacts">OFFLINE</li></ul>')

            online_contacts = `<ul>${online_contacts.join('')}</ul>`
            offline_contacts = `<ul>${offline_contacts.join('')}</ul>`

            $('#online-contacts').append(online_contacts)
            $('#offline-contacts').append(offline_contacts)
        }

        socket.emit('retrieve_contacts', {user_id : user_id}, fill_contact_list)
    }

    function fill_chat_history(target_id, history) {
        // history is an array of RowPacketData
        // target_id is the ID of the "lawan bicara"
        function boxify(data, index, array)
        {
            console.log('x', data)
            let positions = []
            let prof_pic = ''

            // This is the so-called "lawan bicara"
            if (target_id === data.recipient_id) {
                positions = ['left', 'right', this.sender_pic]
            }

            else {
                positions = ['right', 'left', avatar]
            }

            const box = `<div class="direct-chat-msg ${positions[0]}">
              <div class="direct-chat-info clearfix">
                <span class="direct-chat-name pull-${positions[0]}">${data.first_name + ' ' + data.last_name}</span>
                <span class="direct-chat-timestamp pull-${positions[1]}">${data.date.slice(0, 10)} ${data.time}</span>
              </div>
              <img class="direct-chat-img" src="${positions[2]}" alt="Avatar" onError="this.onerror=null;this.src='${positions[2]}';">
              <div class="direct-chat-text">${data.text}</div>
            </div>`

            return box
        }

        if ( ! this.update)
        {
            $('.direct-chat-contacts-custom').toggle('drop')
            $('.direct-chat-messages').toggle('clip')
        }

        if (history.length === 0) {
            return $('#loading').replaceWith(`<div id="loading" data-recipient_id="${target_id}">No chat whatsoever</div>`)
        }

        const history_display = history.map(boxify.bind(this))
        //console.log(history_display)

        $('#loading').replaceWith(`<div id="loading" data-recipient_id="${target_id}">` + history_display + '</div>')
    }

    // Initialization
    room.then(retrieve_contacts).catch(show_error)

    // Removing class "modal" that apparently make elements buggy in Tickets page
    $( "#AssignTickets" ).removeClass('modal')
    $( "#MergeTickets" ).removeClass('modal')
    $( "#surrender" ).removeClass('modal')
    $( "#surrender2" ).removeClass('modal')
    $( "#addccc" ).removeClass('modal')
    $( "#4assign" ).removeClass('modal')
    $( "#ChangeOwner" ).removeClass('modal')
    $( "#1assign" ).removeClass('modal')
    $( "#banemail" ).removeClass('modal')
    $( "#Edit" ).removeClass('modal')


    socket.on('incoming_message', (data, cb) =>
    {
        //console.log('incoming', typeof data.sender_id, typeof parseInt($('#loading').data('recipient_id')), typeof $('#loading').data('recipient_id'))
        const update_request =
        {
            sender_id : user_id,
            recipient_id : data.sender_id
        }

        // Check if the incoming message's sender is the one whose chat history is opened
        if (data.sender_id === parseInt($('#loading').data('recipient_id')))
        {
            console.log('Update chat history immediately')
            // Update chat history immediately
            socket.emit('retrieve_chat_history', update_request, fill_chat_history.bind({update : true, sender_pic : data.sender_pic}, update_request.recipient_id))
        }

        else
        {
            console.log('Notify the user')
            const options =
            {
                body : data.text
            }

            // Notify the user and ...
            notify_user(options, data.sender_name)

            // ... tell him/her that there's unred message(s)
            //$('#new-messages').attr('title', `${++unread_msg} new messages`).html(`${unread_msg}`)
        }
    })

    $('#chat-widget').after('<div id="chat-box" style="position:absolute; bottom: 1em; right: 1em"><ons-fab ripple id="chat-button"><ons-icon icon="md-inbox" size="32px, material:24px"></ons-icon></ons-fab></div>')

    //$('#chat-box').after(<div id="chat-room" style="display: none;  overflow:auto; border-radius: 10px; background-color: red; position: absolute; bottom: 3em; right: 3em; height: 33%; width: 20%"><ons-page><ons-toolbar><div class="center">IM</div><div class="right"><ons-toolbar-button><ons-icon icon="ion-close-round, material:md-menu"></ons-icon></ons-toolbar-button></div></ons-toolbar><div style="position: absolute; bottom: 0em; max-width:60%; float: left"><ons-input id="username" modifier="underbar" placeholder="Username" float></ons-input></div><div style="position: absolute; bottom: 0em; right: 0em; overflow: hidden"><ons-button onclick="return false">SEND</ons-button></div></ons-page></div>')
    $('#chat-box').after(`<div id="chat-room" style="display: none; border-radius: 10px; background-color: red; position: absolute; bottom: 9em; right: 4em; height: 40%; width: 20%; z-index:99999">
      <div class="box box-primary direct-chat direct-chat-primary">
        <div class="box-header with-border">
          <h3 class="box-title">Direct Chat</h3>
          <div class="box-tools pull-right">

            <span data-toggle="tooltip" id="new-messages" class="badge bg-green"></span>

            <button id="contact-button" class="btn btn-box-tool" data-toggle="tooltip" title="Contacts"  data-widget="chat-pane-toggle"><i class="fa fa-comments"></i></button>

          </div>
        </div><!-- /.box-header -->
        <div class="box-body" style="position:relative">

          <div id="chat-area" class="direct-chat-messages" style="display:auto">
            <div id="loading" data-recipient_id="0" style="width:100%; height: 100%">Loading chat history...</div>
          </div>

          <!-- Contacts are loaded here -->
          <div class="direct-chat-contacts-custom" style="display:none; height:100%; width: 100%">
            <ul id="contact-list">
            </ul>
          </div>

        </div><!-- /.box-body -->
        <div class="box-footer">
          <div class="input-group">
            <input id="chat-input" type="text" name="message" placeholder="Type Message ..." class="form-control">
            <span class="input-group-btn">
              <button type="button" id="send-chat" class="btn btn-primary btn-flat">Send</button>
            </span>
          </div>
        </div><!-- /.box-footer-->
      </div><!--/.direct-chat -->
</div>`)

    // Toggle the chat widget
    $('#chat-button').click(() => {$('#chat-room').toggle('clip')})

    //$('body').on('click', '#contact-button', function(event) {
    // Toggle the contact list
    $('#contact-button').click((event) => {
        $('.direct-chat-contacts-custom').toggle('drop')
        $('.direct-chat-messages').toggle('clip')
        retrieve_contacts()
    })

    $('#chat-input').submit((event) =>
    {
        $('#send-chat').click()
    })

    $('#send-chat').click((event) => {
        const data = {
            sender_id : user_id,
            sender_pic : avatar,
            recipient_id : parseInt($('#loading').data('recipient_id')),
            text : $('#chat-input').val()
        }

        socket.emit('send_new_message', data, fill_chat_history.bind({update : true, sender_pic : avatar}, data.recipient_id))
    })

    // Select the active contact
    $('body').on('click', '.contact-item', (event) => {
        try {
            // Retrieve chat history for the selected user for this day
            const recipient_id = parseInt(event.currentTarget.dataset.user_id)
            const data =
            {
                sender_id : user_id,
                recipient_id : recipient_id
            }

            if (event.currentTarget.classList[1] === 'offline')
            {
                console.log("Can't initiate chat with offline contact")
                return event.preventDefault()
            }

            socket.emit('retrieve_chat_history', data, fill_chat_history.bind({update : false, sender_pic : avatar}, recipient_id))
        }

        catch(err) {
            show_error(err)
        }
    })

    $('#sign-out').click((event) => {
        try
        {
            socket.emit('disconnect', {}, alert)
        }

        catch(err)
        {
            show_error(err)
        }
    })
})()
/*<div class="direct-chat-contacts-custom" style="display:none">
            <ul class="contacts-list">
              <li>
                <a href="#">
                  <img class="contacts-list-img" src="../dist/img/user1-128x128.jpg" alt="Contact Avatar">
                  <div class="contacts-list-info">
                    <span class="contacts-list-name">
                      Count Dracula
                      <small class="contacts-list-date pull-right">2/28/2015</small>
                    </span>
                    <span class="contacts-list-msg">How have you been? I was...</span>
                  </div><!-- /.contacts-list-info -->
                </a>
              </li><!-- End Contact Item -->
            </ul><!-- /.contacts-list -->
          </div><!-- /.direct-chat-pane -->
          <!-- Message to the left -->
            <!--<div class="direct-chat-msg">
              <div class="direct-chat-info clearfix">
                <span class="direct-chat-name pull-left">Alexander Pierce</span>
                <span class="direct-chat-timestamp pull-right">23 Jan 2:00 pm</span>
              </div>
              <img class="direct-chat-img" src="../dist/img/user1-128x128.jpg" alt="message user image">
              <div class="direct-chat-text">
                Is this template really for free? That's unbelievable!
              </div>
            </div>-->

            <!-- Message to the right i.e. yourself -->
            <!--<div class="direct-chat-msg right">
              <div class="direct-chat-info clearfix">
                <span class="direct-chat-name pull-right">Sarah Bullock</span>
                <span class="direct-chat-timestamp pull-left">23 Jan 2:05 pm</span>
              </div>
              <img class="direct-chat-img" src="../dist/img/user3-128x128.jpg" alt="message user image">
              <div class="direct-chat-text">
                You better believe it!
              </div>
            </div>-->
            <!--<button class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i></button>-->
            <!--<button class="btn btn-box-tool" data-widget="remove"><i class="fa fa-times"></i></button>-->*/
