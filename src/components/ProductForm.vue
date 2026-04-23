<template>
  <div class="product-detail-container">
    
    <div v-if="showValidationErrors" class="error-banner">
      <strong>Please fix the following:</strong>
      <ul>
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="header-actions">
      <div class="product-header-info">
        
        <div class="input-group full-width">
            <label class="input-label">Product Name</label>
            <input 
              id="product-name" 
              class="form-input input-title" 
              placeholder="e.g. UltraSlim X1 Laptop" 
              v-model="product.name" 
            />
        </div>
        
        <div class="meta-row">
            <div class="half-width">
                <label class="input-label">Category</label>
                <input 
                  class="form-input" 
                  placeholder="e.g. Computers" 
                  v-model="product.category" 
                  list="category-options"
                />
                <datalist id="category-options">
                  <option v-for="cat in uniqueCategories" :key="cat" :value="cat"></option>
                </datalist>
            </div>
            <div class="half-width">
                <label class="input-label">Brand</label>
                <input 
                  class="form-input" 
                  placeholder="e.g. Sony" 
                  v-model="product.brand" 
                  list="brand-options"
                />
                <datalist id="brand-options">
                  <option v-for="brand in uniqueBrands" :key="brand" :value="brand"></option>
                </datalist>
            </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="saveProduct" class="btn save-btn">
          {{ product.id ? 'Save Changes' : 'Create Product' }}
        </button>
      </div>
    </div>

    <hr class="divider">

    <div class="product-content">
      
      <div class="image-column">
        <label class="input-label">Product Image</label>
        
        <div class="image-placeholder">
        <img 
          :src="localPreviewUrl || resolveImageUrl(product)" 
          alt="Product Preview" 
          @error="handleImageError"
        />
          
          <div v-if="isUploading" class="upload-overlay">Uploading...</div>
        </div>

        <div class="file-upload-wrapper">
            <input type="file" @change="uploadImage" accept="image/*" class="standard-file-input" />
            <div class="help-text">Supported: JPG, PNG</div>
        </div>
      </div>

      <div class="info-column">
        
        <div class="input-group">
           <label class="input-label">Price ($)</label>
           <input 
             id="product-price" 
             class="form-input input-price" 
             placeholder="0.00" 
             v-model="product.price" 
             type="number" 
             step="0.01" 
           />
        </div>

        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea 
            rows="8" 
            class="form-input description-input" 
            placeholder="Enter full product description..." 
            v-model="product.description" 
          />
        </div>
        
        <input type="hidden" v-model="product.id" />

      </div>
    </div>

  </div>
</template>

<script>
  const productServiceUrl = '/product/';
  
  export default {
    name: 'ProductForm',
    props: ['products', 'resolveImageUrl'], 
    emits: ['addProductsToList','updateProductInList'],
    data() {
      return {
        product: {
          id: 0,
          name: '',
          image: '/placeholder.png', 
          description: '',
          price: 0.00,
          category: '',
          brand: '',
          lastImageUpdate: Date.now()
        },
        pendingImageFile: null,
        localPreviewUrl: null,
        showValidationErrors: false,
        isUploading: false
      }
    },
    watch: {
      products: {
        immediate: true, 
        handler() { this.initForm(); }
      },
      '$route.params.id': {
        immediate: true,
        handler() { this.initForm(); }
      }
    },
    computed: {
      validationErrors() {
        let errors = [];
        if (!this.product.name) errors.push('Please enter a name');
        if (!this.product.description) errors.push('Please enter a description');
        if (this.product.price <= 0) errors.push('Price must be greater than 0');
        if (!this.product.category) errors.push('Please enter a category');
        if (!this.product.brand) errors.push('Please enter a brand');
        return errors;
      },
      uniqueCategories() {
        if (!this.products) return [];
        // Extract categories, remove duplicates using Set, and sort alphabetically
        const categories = this.products.map(p => p.category).filter(c => c && c.trim() !== '');
        return [...new Set(categories)].sort();
      },
      uniqueBrands() {
        if (!this.products) return [];
        const brands = this.products.map(p => p.brand).filter(b => b && b.trim() !== '');
        return [...new Set(brands)].sort();
      }
    },
    methods: {
      // Sets image to placeholder on error
      handleImageError(e) {
        e.target.src = "/placeholder.png";
      },
      // Initializes form based on route param ID
      initForm() {
        const paramId = this.$route.params.id;
        if (paramId) {
            this.loadProductFromProps(paramId);
        } else {
            this.resetForm();
        }
      },
      // Resets form to default state
      resetForm() {
        this.product = {
          id: 0, name: '', 
          image: '/placeholder.png', 
          description: '', price: 0.00, category: '', brand: '',
          lastImageUpdate: Date.now()
        };
        this.pendingImageFile = null;
        this.localPreviewUrl = null;
        this.showValidationErrors = false;
        this.isUploading = false;
      },
      // Loads product data from props based on ID
      loadProductFromProps(paramId) {
        if (!this.products || this.products.length === 0) return;
        const foundProduct = this.products.find(p => p.id == paramId);
        if (foundProduct) {
           this.product = Object.assign({}, foundProduct);
           this.product.lastImageUpdate = Date.now();
           this.pendingImageFile = null;
           this.localPreviewUrl = null;
        }
      },
      // Handles image upload and preview
      async uploadImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.product.id) {
            this.pendingImageFile = file;
            this.localPreviewUrl = URL.createObjectURL(file);
            return;
        }

        await this.performBackendUpload(file, this.product.id);
      },
      // Performs backend upload of image file
      async performBackendUpload(file, productId) {
        this.isUploading = true;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', productId);

        try {
            const response = await fetch(`${productServiceUrl}upload`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.product.lastImageUpdate = Date.now();
                this.pendingImageFile = null;
                this.localPreviewUrl = null;
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading image');
        } finally {
            this.isUploading = false;
        }
      },
      // Saves product (create or update)
      saveProduct() {
        if (this.validationErrors.length > 0) {
          this.showValidationErrors = true;
          return;
        }

        let method = 'PUT';
        if (!this.$route.params.id) {
          method = 'POST';
        }

        this.product.price = parseFloat(this.product.price);

        fetch(`${productServiceUrl}`, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.product)
        })
          .then(response => response.json())
          .then(async savedProduct => {
            
            if (this.pendingImageFile) {
                await this.performBackendUpload(this.pendingImageFile, savedProduct.id);
            }

            alert('Product saved successfully');            
            
            this.product = { ...this.product, ...savedProduct };

            if (method === 'PUT') {
              this.$emit('updateProductInList', this.product);
            } else {
              this.$emit('addProductsToList', this.product);
            }
            this.$router.push(`${productServiceUrl}${this.product.id}`);
          })
          .catch(error => {
            console.log(error)
            alert('Error occurred while saving product')
          })
      }
    }
  }
</script>

<style scoped>
.product-detail-container {
  text-align: left;
  max-width: 900px;
  margin: 20px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.error-banner {
    background-color: #fff0f0;
    border-left: 4px solid #cc0000;
    color: #cc0000;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
}
.error-banner ul {
    margin: 5px 0 0 20px;
    padding: 0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.product-header-info {
    flex: 1;
}

.input-group {
    margin-bottom: 15px;
}

.input-label {
    display: block;
    font-weight: 700;
    color: #888;
    margin-bottom: 4px;
    font-size: 0.75rem; 
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap; 
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    box-sizing: border-box; 
    transition: border-color 0.2s;
}

.form-input:focus {
    border-color: #0046be;
    outline: none;
    background-color: #f9fbff;
}

.input-title {
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
    padding: 5px 0;
    border: none;
    border-bottom: 2px solid #eee;
    background: transparent;
    border-radius: 0;
    margin-bottom: 15px;
}
.input-title:focus {
    background-color: transparent;
    border-bottom-color: #0046be;
}

.input-price {
    font-size: 1.4rem;
    font-weight: bold;
    color: #0046be;
    width: 150px;
}

.description-input {
    line-height: 1.6;
    color: #444;
    resize: vertical;
}

.meta-row {
    display: flex;
    gap: 20px;
}

.half-width {
    flex: 1;
}

.product-content {
  display: flex;
  gap: 40px;
}

.image-column {
  flex: 0 0 300px;
}

.info-column {
  flex: 1;
}

.image-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
  background-color: #fafafa;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.image-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
  box-sizing: border-box;
}

.no-image {
  color: #ccc;
  font-weight: bold;
}

.upload-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #0046be;
    font-weight: bold;
}

.file-upload-wrapper {
    text-align: left; 
}

.standard-file-input {
    display: block;
    width: 100%;
    font-size: 0.9rem;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.help-text {
    margin-top: 5px;
    font-size: 0.8rem;
    color: #888;
}

.divider {
    border: 0;
    border-top: 1px solid #eee;
    margin: 30px 0;
}

.btn {
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.2s; 
}

.save-btn {
  background-color: #0046be; 
  color: white; 
}

.save-btn:hover {
  background-color: #003da6;
}

.action-buttons {
    display: flex;
    align-items: flex-start;
}

@media (max-width: 768px) {
  .product-content {
    flex-direction: column;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .meta-row {
      flex-direction: column;
      gap: 10px;
  }
  
  .image-column {
      flex: 0 0 auto;
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
  }
}
</style>