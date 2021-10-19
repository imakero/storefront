const root = document.getElementById('root')

const url = 'https://mock-data-api.firebaseio.com/webb21/products.json'
const cart = []
const tableFields = ['price', 'rating', 'stock']

let productsData = []
let ratingFilter = () => true
let ratingThreshold = 0
let errorTimeout = null
let errorCleanup = null

/*
 * Helper functions
 */
const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1)
const isEvent = (key) => key.startsWith('on')
const notEvent = (key) => !isEvent(key)
const groupBy = (objects, key) =>
  objects.reduce((groups, object) => {
    const value = object[key]
    groups[value] = groups[value] || []
    groups[value].push(object)
    return groups
  }, {})
const calculateTotal = (cart) =>
  cart.reduce((sum, product) => sum + product.price, 0)

/*
 * Components
 */

function Header() {
  return createElement('article', { className: 'header-wrapper' }, [
    createElement(Cart, {}, []),
    createElement(Filter, {}, []),
  ])
}

function Cart() {
  return createElement('div', { className: 'cart-wrapper' }, [
    createElement('h2', {}, 'Varukorg'),
    createElement('div', { className: 'cart-container' }, [
      createElement(CartItems, { cart }, []),
    ]),
    createElement(Total, { cart }, []),
  ])
}

function CartItems({ cart }) {
  const itemsByName = groupBy(cart, 'name')
  return createElement(
    'ul',
    {},
    Object.entries(itemsByName).map(([name, products]) =>
      createElement(
        CartItem,
        { name, quantity: products.length, price: products[0].price },
        []
      )
    )
  )
}

function CartItem({ name, quantity, price }) {
  const quantityString = quantity === 1 ? '' : `${quantity} x `
  const totalString = quantity === 1 ? '' : ` (${price * quantity})`
  const cartRowString = `${quantityString}${name} - ${price}${totalString}`
  return createElement('li', {}, cartRowString)
}

function Filter() {
  return createElement('form', { onSubmit: handleRatingFilterSubmit }, [
    createElement('h2', {}, 'Filter'),
    createElement(
      'input',
      {
        id: 'rating-filter-input',
        type: 'number',
        min: '0',
        max: '5',
        step: '0.1',
        value: ratingThreshold.toString(),
        onChange: (event) => (ratingThreshold = parseFloat(event.target.value)),
      },
      []
    ),
    createElement('button', { type: 'submit' }, 'Filtrera på rating'),
  ])
}

function Total({ cart }) {
  return cart.length
    ? createElement('p', {}, `Total: ${calculateTotal(cart)}`)
    : createElement('p', {}, 'Varukorgen är tom')
}

function Products({ products }) {
  return createElement(
    'div',
    { className: 'products-grid' },
    products.map((product) => createElement(Product, { product }, []))
  )
}

function Product({ product }) {
  const imageData = product.images[0]

  return createElement(
    'article',
    { className: 'product', id: `product-${product.id}` },
    [
      createElement('div', {}, [
        createElement(
          'img',
          { src: imageData.src.small, alt: imageData.alt },
          []
        ),
        createElement('h2', {}, product.name),
        createElement('p', {}, product.description),
      ]),
      createElement('div', {}, [
        createElement(InfoTable, { product, fields: tableFields }, []),
        createElement(
          'button',
          { onClick: (event) => handleBuy(product, event.target) },
          'Köp'
        ),
      ]),
    ]
  )
}

function InfoTable({ product, fields }) {
  const definedFields = fields.filter((field) => product[field] !== undefined)

  return createElement('table', {}, [
    createElement(InfoTableHead, { fields: definedFields }, []),
    createElement(InfoTableBody, { product, fields: definedFields }),
  ])
}

function InfoTableHead({ fields }) {
  return createElement('thead', {}, [
    createElement(
      'tr',
      {},
      fields.map((field) => createElement('th', {}, capitalize(field)))
    ),
  ])
}

function InfoTableBody({ product, fields }) {
  return createElement('tbody', {}, [
    createElement(
      'tr',
      {},
      fields.map((field) =>
        createElement(InfoTableData, { product, field }, [])
      )
    ),
  ])
}

function InfoTableData({ product, field }) {
  const attributes = field === 'stock' ? { className: 'stock-data' } : {}

  return createElement('td', attributes, product[field].toString())
}

/*
 * Handlers
 */

function handleRatingFilterSubmit(event) {
  event.preventDefault()

  if (ratingThreshold === 0) {
    ratingFilter = () => true
  } else {
    ratingFilter = (product) => product.rating >= ratingThreshold
  }
  renderSite()
}

function handleBuy(productToBuy, domNode) {
  const id = productToBuy.id
  const product = productsData.find((p) => p.id === id)
  if (product.stock >= 1) {
    const newProduct = { ...product, stock: product.stock - 1 }
    productsData = productsData.map((p) =>
      p.id !== product.id ? p : newProduct
    )
    addProductToCart(product)
    updateProductCount(newProduct)
  } else {
    displayError('Not enough items in stock!', 3, domNode)
  }
}

function displayError(message, seconds, domNode) {
  if (errorTimeout) {
    clearTimeout(errorTimeout)
    errorCleanup()
  }
  domNode.setAttribute('data-tooltip', message)
  errorCleanup = () => domNode.removeAttribute('data-tooltip')
  errorTimeout = setTimeout(errorCleanup, seconds * 1000)
}

function updateProductCount(product) {
  const productElement = document.getElementById(`product-${product.id}`)
  productElement.querySelector('.stock-data').innerText = product.stock
}

function addProductToCart(product) {
  cart.push(product)
  renderSite()
}

/*
 * Generate DOM nodes
 */

function createElement(type, attributes, children) {
  if (typeof type === 'function') {
    return type(attributes)
  }
  const element = document.createElement(type)
  Object.keys(attributes)
    .filter(notEvent)
    .forEach((key) => {
      element[key] = attributes[key]
    })
  Object.keys(attributes)
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.substring(2).toLowerCase()
      element.addEventListener(eventType, attributes[key])
    })
  if (typeof children === 'string') {
    element.innerText = children
  } else {
    children.forEach((child) => {
      element.appendChild(child)
    })
  }
  return element
}

function renderSite() {
  root.innerHTML = ''
  root.appendChild(createElement(Header, {}, []))
  root.appendChild(
    createElement(Products, { products: productsData.filter(ratingFilter) }, [])
  )
}

function getStoreData(url) {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      productsData = data
    })
}

getStoreData(url).then(() => renderSite())
