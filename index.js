const productsContainer = document.getElementById('products-container')
const totalContainer = document.getElementById('total-container')
const cartContainer = document.getElementById('cart-container')
const ratingFilterForm = document.getElementById('rating-filter-form')
const ratingFilterInput = document.getElementById('rating-filter-input')
ratingFilterForm.addEventListener('submit', handleRatingFilterSubmit)
const url = 'https://mock-data-api.firebaseio.com/webb21/products.json'
const cart = []
let productsData = []
let ratingFilter = (product) => true

function handleRatingFilterSubmit(event) {
  event.preventDefault()
  const value = parseFloat(ratingFilterInput.value)
  if (value === 0) {
    ratingFilter = (product) => true
  } else {
    ratingFilter = (product) => product.rating >= value
  }
  renderProducts(productsData.filter(ratingFilter))
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function groupBy(objects, key) {
  return objects.reduce((groups, object) => {
    const value = object[key]
    groups[value] = groups[value] || []
    groups[value].push(object)
    return groups
  }, {})
}

function addProductToCart(product) {
  cart.push(product)
  renderTotal(cart)
  renderCart(cart)
}

function getStoreData(url) {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      productsData = data
    })
}

function renderProducts(products) {
  productsContainer.innerHTML = ''
  products.forEach(renderProduct)
}

function renderProduct(product) {
  const productWrapper = document.createElement('div')
  productWrapper.className = 'product'

  const topWrapper = document.createElement('div')
  topWrapper.appendChild(createTitle(product))
  topWrapper.appendChild(createImage(product))
  topWrapper.appendChild(createDescription(product))

  const bottomWrapper = document.createElement('div')
  bottomWrapper.appendChild(
    createInfoTable(product, ['price', 'rating', 'stock'])
  )
  bottomWrapper.appendChild(createBuyButton(product))
  productWrapper.appendChild(topWrapper)
  productWrapper.appendChild(bottomWrapper)
  productsContainer.appendChild(productWrapper)
}

function createTitle(product) {
  return createHeader(product.name)
}

function createImage(product) {
  const img = document.createElement('img')
  const imageData = product.images[0]
  img.src = imageData.src.small
  img.alt = imageData.alt
  img.addEventListener('click', () => addProductToCart(product))
  return img
}

function createDescription(product) {
  const p = document.createElement('p')
  p.innerText = product.description
  return p
}

function createInfoTable(product, fields) {
  const table = document.createElement('table')
  const definedFields = fields.filter((field) => product[field] !== undefined)
  table.appendChild(createTableHeader(product, definedFields))
  table.appendChild(createTableBody(product, definedFields))
  return table
}

function createTableHeader(product, fields) {
  const tableHeader = document.createElement('thead')
  const tableRow = document.createElement('tr')
  fields.forEach((field) =>
    tableRow.appendChild(createTableData(capitalize(field)))
  )
  tableHeader.appendChild(tableRow)
  return tableHeader
}

function createTableBody(product, fields) {
  const tableBody = document.createElement('tbody')
  const tableRow = document.createElement('tr')
  fields.forEach((field) =>
    tableRow.appendChild(createTableData(product[field]))
  )
  tableBody.appendChild(tableRow)
  return tableBody
}

function createTableData(value) {
  const tableData = document.createElement('td')
  tableData.innerText = value
  return tableData
}

function createBuyButton(product) {
  const button = document.createElement('button')
  button.innerText = 'Köp'
  button.addEventListener('click', () => addProductToCart(product))
  return button
}

function renderTotal(cart) {
  totalContainer.innerHTML = ''
  totalContainer.appendChild(createTotal(cart))
}

function createTotal(cart) {
  const p = document.createElement('p')
  p.innerText = `Total: ${calculateTotal(cart)}`
  return p
}

function calculateTotal(cart) {
  return cart.reduce((sum, product) => sum + product.price, 0)
}

function renderCart(cart) {
  cartContainer.innerHTML = ''
  cartContainer.appendChild(createHeader('Varukorg'))
  renderCartItems(cart)
}

function renderCartItems(cart) {
  const itemsByName = groupBy(cart, 'name')
  const ul = document.createElement('ul')
  Object.entries(itemsByName).forEach(([name, products]) =>
    renderCartItem(ul, name, products.length, products[0].price)
  )
  cartContainer.appendChild(ul)
}

function renderCartItem(container, name, quantity, price) {
  container.appendChild(createCartRow(name, quantity, price))
}

function createCartRow(name, quantity, price) {
  const quantityString = quantity === 1 ? '' : `${quantity} x `
  const totalString = quantity === 1 ? '' : ` (${price * quantity})`
  const li = document.createElement('li')
  li.innerText = `${quantityString}${name} - ${price}${totalString}`
  return li
}

function createHeader(text) {
  const h2 = document.createElement('h2')
  h2.innerText = text
  return h2
}

function renderSite() {
  renderTotal(cart)
  renderCart(cart)
  renderProducts(productsData.filter(ratingFilter))
}

getStoreData(url).then(() => renderSite())
