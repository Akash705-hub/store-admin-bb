<template>
  <div class="product-list-container">
    
    <div class="list-header">
      <h2>Products</h2>
      <router-link to="/product/add">
        <button class="btn-main">Add Product</button>
      </router-link>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th class="text-left">Product Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.productId" class="product-row">
            <td>
              <router-link :to="`/product/${product.id}`" class="id-link">
                {{ product.id }}
              </router-link>
            </td>
            <td><strong>{{ product.name }}</strong></td>
            
            <td class="text-left description-cell" :title="product.description">
              {{ truncateDescription(product.description) }}
            </td>

            <td class="price-cell">${{ product.price }}</td>
          </tr>
          
          <tr v-if="!products || products.length === 0">
            <td colspan="4" class="empty-state">No products found.</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
  export default {
    name: 'ProductList',
    props: ['products'],
    mounted() {
      this.$emit('getProducts')
    },
    methods: {
      // Truncates text if it exceeds 60 characters
      truncateDescription(text) {
        if (!text) return '';
        const limit = 60; 
        if (text.length > limit) {
          return text.substring(0, limit) + '...';
        }
        return text;
      }
    }
  }
</script>

<style scoped>
.product-list-container {
  max-width: 1000px;
  margin: 20px auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f4f4f4;
  border-bottom: 1px solid #ddd;
}

.list-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #444;
}

.btn-main {
  background-color: #0046be; 
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-main:hover {
  background-color: #003396;
}

.table-wrapper {
  padding: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; 
}

th {
  text-align: center;
  padding: 15px;
  background-color: #fafafa;
  color: #444;
  border-bottom: 2px solid #eee;
  font-weight: bold;
}

td {
  text-align: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.product-row {
  transition: background-color 0.1s;
}

.product-row:hover {
  background-color: #f9f9f9;
}

.text-left {
  text-align: left;
}

.description-cell {
  width: 40%; 
  color: #666;
  font-size: 0.95rem;
}

.price-cell {
  font-weight: bold;
  color: #333;
}

/* LINKS */
a {
  text-decoration: none;
}

.id-link {
  color: #0046be;
  font-weight: bold;
}

.id-link:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 40px;
  color: #888;
  font-style: italic;
}
</style>