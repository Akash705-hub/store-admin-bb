<template>
  <TopNav />
  <router-view
    :orders="orders"
    :products="products"
    :resolveImageUrl="resolveImageUrl" 
    @fetchOrders="fetchOrders"
    @completeOrder="completeOrder"
    @addProductsToList="addProductsToList"
    @updateProductInList="updateProductInList"
    @getProducts="getProducts"
    @cancelOrder="cancelOrder"
    @shipOrder="shipOrder"
    @updateOrder="updateOrder"
    @deleteProduct="deleteProduct"
  ></router-view>
</template>

<script>
import TopNav from './components/TopNav.vue';

const productServiceUrl = "/products/";
const singleProductServiceUrl = "/product/";
const makelineServiceUrl = "/makeline/";
const shippingServiceUrl = "/ship/";

export default {
  name: 'App',
  components: {
    TopNav
  },
  data() {
    return {
      orders: [],
      products: [],
      polling: null
    }
  },
  mounted() {
    this.getProducts();
    this.fetchOrders();
    this.polling = setInterval(() => {
      this.fetchOrders();
    }, 2000);
    document.title = "Best Buy: Admin Portal | Best Buy Canada";
  },
  beforeUnmount() {
    clearInterval(this.polling);
  },
  methods: {
    // Constructs image URL with timestamp (for cache busting in future)
    resolveImageUrl(product) {
      if (!product || !product.id) return '/placeholder.png';
      
      const timestamp = product.lastImageUpdate || '';
      return `${productServiceUrl}${product.id}/image?t=${timestamp}`;
    },
    // Fetches orders from backend and updates local list
    async fetchOrders() {
      await fetch(`${makelineServiceUrl}order/fetch`)
      .then(response => response.json())
      .then(incomingOrders => {
          if (incomingOrders) {
              this.orders = incomingOrders.map(newOrder => {
                  const existingOrder = this.orders.find(o => o.orderId === newOrder.orderId);
                  let duration = 0;
                  let shippedAt = null; 

                  if (newOrder.shipping) {
                      duration = newOrder.shipping.duration || 0;
                      shippedAt = newOrder.shipping.shippedAt;
                  }
                  
                  if (duration === 0 && existingOrder && existingOrder.duration) {
                      duration = existingOrder.duration;
                  }
                  if (duration > 0 && shippedAt) {
                      const totalDeliveryTimeMs = duration * 1000;
                      const startTime = new Date(shippedAt).getTime();
                      const now = Date.now();
                      const timePassedMs = now - startTime;

                      if (timePassedMs < totalDeliveryTimeMs) {
                          newOrder.duration = duration;
                          const progressPercent = (timePassedMs / totalDeliveryTimeMs) * 100;
                          newOrder.progressPercent = Math.min(progressPercent, 100);
                          newOrder.totalDurationMs = totalDeliveryTimeMs;
                          newOrder.remainingDurationMs = totalDeliveryTimeMs - timePassedMs;
                      } else {
                          newOrder.progressPercent = 100;
                          newOrder.duration = 0;
                          newOrder.totalDurationMs = 0;
                          newOrder.remainingDurationMs = 0;
                      }
                  } else {
                      newOrder.duration = duration;
                      newOrder.progressPercent = 0;
                      newOrder.totalDurationMs = duration * 1000;
                  }
                  return newOrder;
              });
          } else {
              this.orders = [];
          }
      })
      .catch(error => console.error(error));
    },
    // Sends shipping request to shipping service and updates order status
    async shipOrder(orderId) {
      let order = this.orders.find(o => o.orderId === orderId);
      if (!order) return;

      const payload = {
        orderId: String(order.orderId), 
        shipping: {
            postalCode: order.shipping.zip || order.shipping.postalCode || "K1A 0B1", 
            address1: order.shipping.address1,
            city: order.shipping.city
        },
        status: 2 
      };
      await fetch(`${shippingServiceUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
          if (res.ok) {
              order.status = 2; 
              alert(`Order ${orderId} has been queued for shipping!`);
          } else {
              alert("Failed to queue shipment. Check Shipping Service.");
          }
      })
      .catch(err => console.error("Shipping Error:", err));
    },
    // Updates order status to 'Processing'
    async completeOrder(orderId) {
      await this.updateOrderStatus(orderId, 1);
      alert('Order processed successfully');
    },
    // Cancels order by deleting it from backend
    async cancelOrder(orderId) {
      await fetch(`${makelineServiceUrl}order/${orderId}`, { method: 'DELETE' })
      .then(res => {
         if (res.ok) {
            this.orders = this.orders.filter(o => o.orderId !== orderId);
            if (this.$route.path.includes(`/order/${orderId}`)) this.$router.push('/'); 
            alert('Order cancelled');
         }
      });
    },
    // Updates order items in backend
    async updateOrder({ orderId, items }) {
      let order = this.orders.find(o => o.orderId === orderId);
      if (!order) return;
      order.items = items;
      await fetch(`${makelineServiceUrl}order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    },
    // Updates order status in backend
    async updateOrderStatus(orderId, status) {
      let order = this.orders.find(o => o.orderId === orderId);
      if (!order) return;
      const updatedOrder = { ...order, status: status };
      await fetch(`${makelineServiceUrl}order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      }).then(res => {
        if(res.ok) order.status = status;
      });
    },
    // Adds new product to local list
    async addProductsToList(newProduct) { this.products.push(newProduct); },
    // Updates existing product in local list
    async updateProductInList(updatedProduct) {
       const index = this.products.findIndex(p => p.id === updatedProduct.id);
       if (index !== -1) this.products[index] = updatedProduct;
    },
    // Fetches all products
    async getProducts() {
       fetch(`${productServiceUrl}`).then(r => r.json()).then(p => {
         this.products = p;
       });
    },
    // Deletes a product by ID
    async deleteProduct(productId) {
      if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
        return;
      }
      await fetch(`${singleProductServiceUrl}${productId}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          this.products = this.products.filter(p => p.id !== productId);
          alert("Product deleted successfully");
          this.$router.push('/'); 
        } else {
          alert("Failed to delete product");
        }
      })
      .catch(err => console.error("Delete Error:", err));
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

#app {
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 120px;
  padding: 1rem;
}

footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #333;
  color: #fff;
  padding: 1rem;
  margin: 0;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  margin: 0 1rem;
}

a {
  color: #fff;
  text-decoration: none;
}

table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

th,
td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.order-detail {
  text-align: left;
}

button {
  padding: 10px;
  background-color: #005f8b;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  height: 42px;
}

button:hover {
  background-color: #005f8b;
}

button:active {
  background-color: #003691; 
  transform: translateY(1px);
}


.action-button {
  float: right;
}

.product-detail {
  text-align: left;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  margin: 2rem auto;
}

.product-form {
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: center;
  margin: 2rem auto;
  width: 50%;
}

.form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ai-button {
  margin-left: 10px;
  padding: 10px 10px;
  border-radius: 5px;
  border: none;
  background-color: #007acc;
  color: #fff;
  cursor: pointer;
}

.ai-button:hover {
  background-color: #005f8b;
}

textarea {
  width: 100%;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

label {
  text-align: right;
  margin-right: 10px;
  width: 100px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
</style>