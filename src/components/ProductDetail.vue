<template>
  <div class="product-detail-container" v-if="productExists">
    
    <div class="header-actions">
      <div class="product-header-info">
        <h1>{{ product.name }}</h1>
        <div class="meta-tags">
          <span class="badge">{{ product.category }}</span>
          <span class="brand-text">by <b>{{ product.brand }}</b></span>
        </div>
      </div>

      <div class="action-buttons">
        <router-link :to="`/product/${this.$route.params.id}/edit`">
          <button class="btn edit-btn">Edit Product</button>
        </router-link>
        
        <button class="btn delete-btn" @click="deleteProduct">Delete Product</button>
      </div>
    </div>

    <div class="product-content">
      <div class="image-column">
        <div class="image-placeholder">
          <img 
            v-if="product.id" 
            :src="resolveImageUrl(product)" 
            :alt="product.name"
            @error="handleImageError"
          >
          <div v-else class="no-image">No Image</div>
        </div>
      </div>

      <div class="info-column">
        <div class="price-tag">${{ product.price }}</div>
        
        <div class="info-group">
          <label>Product ID:</label>
          <span>{{ product.id }}</span>
        </div>

        <div class="info-group">
          <label>Description:</label>
          <p class="description-text">{{ product.description }}</p>
        </div>
      </div>
    </div>

  </div>

  <div class="product-detail-container" v-else>
    <h3>Oops! That product was not found...</h3>
    <router-link to="/products">← Back to Products</router-link>
  </div>
</template>

<script>
  export default {
    name: 'ProductDetail',
    props: ['products', 'resolveImageUrl'],
    emits: ['deleteProduct'],
    computed: {
      product() {
        return this.products.find(product => product.id == this.$route.params.id)
      },
      productExists() {
        return !!this.product
      }
    },
    methods: {
      // Sets image to placeholder on error
      handleImageError(e) {
        e.target.src = '/placeholder.png';
      },
      // Emits event to delete product
      deleteProduct() {
        this.$emit('deleteProduct', this.product.id);
      }
    }
  }
</script>

<style scoped>
.product-detail-container {
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
  margin-bottom: 30px;
}

.product-header-info h1 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  color: #333;
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.9rem;
  color: #666;
}

.badge {
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  color: #555;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.product-content {
  display: flex;
  gap: 40px;
}

.image-column {
  flex: 0 0 40%;
}

.info-column {
  flex: 1;
}

.image-placeholder {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
  background-color: #fafafa;
}

.image-placeholder img {
  width: 100%;
  height: auto;
  display: block;
}

.no-image {
  padding: 40px;
  text-align: center;
  color: #ccc;
}

.price-tag {
  font-size: 2rem;
  font-weight: bold;
  color: #0046be; 
  margin-bottom: 20px;
}

.info-group {
  margin-bottom: 20px;
}

.info-group label {
  display: block;
  font-weight: bold;
  color: #444;
  margin-bottom: 5px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.description-text {
  line-height: 1.6;
  color: #555;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  border: 1px solid transparent;
  transition: opacity 0.2s;
}

.edit-btn {
  background-color: #e6f0ff; 
  color: #0046be; 
  border-color: #0046be; 
  margin-right: 10px; 
}

.edit-btn:hover {
  background-color: #0046be; 
  color: white; 
}

.delete-btn {
  background-color: #fff0f0;
  color: #d93025;
  border-color: #d93025;
}

.delete-btn:hover {
  background-color: #d93025;
  color: white;
}

a {
  text-decoration: none;
  color: #0046be;
}

@media (max-width: 768px) {
  .product-content {
    flex-direction: column;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 15px;
  }
}
</style>