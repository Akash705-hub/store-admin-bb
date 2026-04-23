<template>
  <div class="order-detail" v-if="orderExists">
    
    <div class="header-actions">
      <div class="order-info">
        <h1>Order #{{ order.orderId }}</h1>
        <p><b>Customer ID:</b> {{ order.customerId }}</p>
        <p><b>Status:</b> <span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span></p>
      </div>

      <div class="action-buttons">
        <button 
          v-if="order.status === 0" 
          @click="completeOrder" 
          class="btn process-btn"
        >
          Process Order
        </button>

        <button 
          v-if="order.status === 1" 
          @click="shipOrder" 
          class="btn ship-btn"
        >
          Ship Order
        </button>

        <button 
          v-if="order.status <= 1" 
          @click="cancelOrder" 
          class="btn cancel-btn"
        >
          Cancel Order
        </button>
      </div>
    </div>

    <br/>

    <div class="order-items">
      <table>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th v-if="order.status <= 1">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in order.items" :key="item.productId">
            <td><router-link :to="`/product/${item.productId}`">{{ item.productId }}</router-link></td>
            <td>{{ productLookup(item.productId) }}</td>
            <td>{{ item.quantity }}</td>
            <td>${{ item.price.toFixed(2) }}</td>
            <td>${{ (item.quantity * item.price).toFixed(2) }}</td>
            
            <td v-if="order.status <= 1">
              <button @click="deleteItem(index)" class="btn-small delete-btn">Remove</button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align: right;"><b>Grand Total:</b></td>
            <td><b>${{ orderTotal() }}</b></td>
            <td v-if="order.status <= 1"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <div class="order-detail" v-else>
    <h3>Oops! That order was not found...</h3>
    <router-link to="/">← Back to Orders</router-link>
  </div>
</template>

<script>
  export default {
    name: 'OrderDetail',
    props: ['orders', 'products'],
    emits: ['completeOrder', 'shipOrder', 'cancelOrder', 'updateOrder'],
    data() {
      return {
        order: null
      }
    },
    computed: {
      orderExists() {
        return !!this.order
      }
    },
    mounted() {
      this.getOrder()
    },
    methods: {
      // Fetches order details based on route param
      getOrder() {
        this.order = this.orders.find(order => order.orderId === this.$route.params.id);
        
        if (!this.order) {
          const baseUrl = process.env.VUE_APP_MAKELINE_SERVICE_URL || 'http://localhost:3001/';
          fetch(`${baseUrl}order/${this.$route.params.id}`)
            .then(response => {
              if (!response.ok) throw new Error('Network response was not ok');
              if (response.status === 204) return null;
              return response.json();
            })
            .then(data => {
              if (data) this.order = data;
            })
            .catch(error => console.error(error));
        }
      },
      // Looks up product name by ID
      productLookup(id) {
        if (!this.products || this.products.length === 0) return 'Loading...';
        const p = this.products.find(product => product.id === id);
        return p ? p.name : 'Unknown Product';
      },
      // Calculates total amount for the order
      orderTotal() {
        if (!this.order || !this.order.items) return '0.00';
        let total = 0;
        this.order.items.forEach(item => {
          total += item.price * item.quantity;
        });
        return total.toFixed(2);
      },
      // Returns human-readable status text
      getStatusText(status) {
        const statusMap = { 0: 'Ordered', 1: 'Processing', 2: 'Shipped', 3: 'Delivered' };
        return statusMap[status] || 'Unknown';
      },
      // Returns CSS class for status
      getStatusClass(status) {
        const map = { 0: 'status-pending', 1: 'status-processing', 2: 'status-shipped', 3: 'status-delivered' };
        return map[status] || '';
      },
      // Emits event to complete order
      completeOrder() {
        this.$emit('completeOrder', this.order.orderId);
        if (this.$route.path !== '/') this.$router.push('/');
      },
      // Emits event to ship order
      shipOrder() {
        this.$emit('shipOrder', this.order.orderId);
        if (this.$route.path !== '/') this.$router.push('/');
      },
      // Emits event to cancel order
      cancelOrder() {
        if(confirm("Are you sure you want to cancel this order?")) {
          this.$emit('cancelOrder', this.order.orderId);
          if (this.$route.path !== '/') this.$router.push('/');
        }
      },
      // Deletes an item from the order
      deleteItem(index) {
        // Create a copy of items
        const updatedItems = [...this.order.items];
        updatedItems.splice(index, 1);
        
        if (updatedItems.length === 0) {
            this.cancelOrder(); 
            return;
        }
        // Emit event to update backend
        this.$emit('updateOrder', { orderId: this.order.orderId, items: updatedItems });
        // Update local view immediately
        this.order.items = updatedItems;
      }
    }
  }
</script>

<style scoped>
a {
  color: #0046be;
  text-decoration: none;
}

.order-detail {
  text-align: left;
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.order-info h1 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  color: white;
  border: 1px solid transparent;
  transition: opacity 0.2s;
}

.process-btn { background-color: #e6f0ff; color: #0046be; border-color: #0046be; }
.process-btn:hover { background-color: #0046be; color: white; }

.ship-btn { background-color: #e6fffa; color: #008000; border-color: #008000; }
.ship-btn:hover { background-color: #008000; color: white; }

.cancel-btn { background-color: #ffe6e6; color: #cc0000; border-color: #cc0000; }
.cancel-btn:hover { background-color: #cc0000; color: white; }

.btn:hover { opacity: 0.9; }

.btn-small {
  padding: 5px 10px;
  font-size: 0.9rem;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
}

.delete-btn {
  background-color: #ffdddd;
  color: #cc0000;
  border: 1px solid #cc0000;
}
.delete-btn:hover { background-color: #ffbbbb; }

.status-pending { color: #cc0000; font-weight: bold; }
.status-processing { color: #e6b800; font-weight: bold; }
.status-shipped { color: #008000; font-weight: bold; }
.status-delivered { color: #7c7c7c; font-weight: bold; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #eee; }
th { text-align: left; color: #666; }
</style>