const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

const autoscroll = () => {
  const $lastMessage = $messages.lastElementChild

  const lastMessageStyles = getComputedStyle($lastMessage)
  const lastMessageMargin = parseInt(lastMessageStyles.marginBottom)
  const lastMessageHeight = $lastMessage.offsetHeight + lastMessageMargin
  const visibleHeight = $messages.offsetHeight
  const containerHeight = $messages.scrollHeight

  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - lastMessageHeight <= scrollOffset + 100) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })

  document.querySelector('#sidebar').innerHTML = html
})

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    username: message.username,
    createdAt: dateFns.format(message.createdAt, 'HH:mm'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (locationMessage) => {
  const html = Mustache.render(locationTemplate, {
    locationMessage: locationMessage.url,
    username: locationMessage.username,
    createdAt: dateFns.format(locationMessage.createdAt, 'HH:mm'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    if (error) {
      return console.error(error)
    }

    $messageFormInput.value = ''
    $messageFormInput.focus()
  })
})

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation)
    return alert('Geolocation is not supported by your browser')

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition(
    (position) => {
      socket.emit(
        'sendLocation',
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        () => {
          $sendLocationButton.removeAttribute('disabled')
        },
      )
    },
    undefined,
    { enableHighAccuracy: true },
  )
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
