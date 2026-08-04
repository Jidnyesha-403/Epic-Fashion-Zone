import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1654764745582-69893ee8a985?crop=entropy&cs=srgb&fm=jpg&q=85"
];

export const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Sarees',
    fabric: 'Silk',
    occasion: 'Festive',
    price: '',
    stock: '',
    tags: '',
    featured: false,
    new_arrival: false,
    images: []
  });

  const getAdminToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAdminToken();

    if (!token) {
      toast.error('Admin authentication required. Please login again.');
      navigate('/admin/login');
      return;
    }

    try {
      const parsedTags = typeof formData.tags === 'string'
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : (Array.isArray(formData.tags) ? formData.tags : []);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        fabric: formData.fabric || 'Silk',
        occasion: formData.occasion || 'Festive',
        price: Math.max(0, parseFloat(formData.price) || 0),
        stock: Math.max(0, parseInt(formData.stock, 10) || 0),
        tags: parsedTags,
        featured: Boolean(formData.featured),
        new_arrival: Boolean(formData.new_arrival),
        images: formData.images.length > 0 ? formData.images : PLACEHOLDER_IMAGES
      };

      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData, authHeaders);
        toast.success('Product updated successfully!');
      } else {
        await axios.post(`${API}/products`, productData, authHeaders);
        toast.success('Product added successfully!');
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.detail || 'Failed to save product. Please check input values.');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const token = getAdminToken();

    try {
      const uploadedUrls = [];

      for (const file of files) {
        let uploaded = false;

        // Strategy 1: Try local backend file upload
        try {
          const bodyData = new FormData();
          bodyData.append('file', file);
          const uploadRes = await axios.post(`${API}/upload`, bodyData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          if (uploadRes.data && uploadRes.data.url) {
            const finalUrl = uploadRes.data.url.startsWith('http')
              ? uploadRes.data.url
              : `${BACKEND_URL}${uploadRes.data.url}`;
            uploadedUrls.push(finalUrl);
            uploaded = true;
          }
        } catch (localErr) {
          console.warn('Local upload failed, trying Cloudinary/Base64 fallback...', localErr);
        }

        // Strategy 2: Try Cloudinary if local upload didn't succeed
        if (!uploaded && token) {
          try {
            const sigResponse = await axios.get(`${API}/cloudinary/signature?folder=products`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const { signature, timestamp, cloud_name, api_key, folder } = sigResponse.data;
            const cData = new FormData();
            cData.append('file', file);
            cData.append('api_key', api_key);
            cData.append('timestamp', timestamp);
            cData.append('signature', signature);
            cData.append('folder', folder);

            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
              { method: 'POST', body: cData }
            );
            const result = await uploadResponse.json();
            if (result.secure_url) {
              uploadedUrls.push(result.secure_url);
              uploaded = true;
            }
          } catch (cErr) {
            console.warn('Cloudinary upload failed...', cErr);
          }
        }

        // Strategy 3: Fallback to Data URL (Base64)
        if (!uploaded) {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} image(s) added successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to process image uploads.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
    setImageUrlInput('');
    toast.success('Image URL added!');
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'Sarees',
      fabric: product.fabric || 'Silk',
      occasion: product.occasion || 'Festive',
      price: product.price !== undefined ? product.price.toString() : '',
      stock: product.stock !== undefined ? product.stock.toString() : '',
      tags: product.tags ? (Array.isArray(product.tags) ? product.tags.join(', ') : product.tags) : '',
      featured: Boolean(product.featured),
      new_arrival: Boolean(product.new_arrival),
      images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : [])
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    const token = getAdminToken();
    if (!token) {
      toast.error('Admin authentication required. Please login again.');
      navigate('/admin/login');
      return;
    }

    try {
      await axios.delete(`${API}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setImageUrlInput('');
    setFormData({
      name: '',
      description: '',
      category: 'Sarees',
      fabric: 'Silk',
      occasion: 'Festive',
      price: '',
      stock: '',
      tags: '',
      featured: false,
      new_arrival: false,
      images: []
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-2" data-testid="products-title">My Products</h1>
            <p className="text-stone-600">Manage your product catalog</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg" data-testid="add-product-button">
                <Plus className="h-5 w-5 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-1"
                    data-testid="product-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    className="mt-1"
                    data-testid="product-description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="mt-1" data-testid="product-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarees">Sarees</SelectItem>
                        <SelectItem value="Handicrafts">Handicrafts</SelectItem>
                        <SelectItem value="Home Decor">Home Decor</SelectItem>
                        <SelectItem value="Gifts">Gifts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fabric">Fabric</Label>
                    <Select value={formData.fabric} onValueChange={(value) => setFormData(prev => ({ ...prev, fabric: value }))}>
                      <SelectTrigger className="mt-1" data-testid="product-fabric-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Silk">Silk</SelectItem>
                        <SelectItem value="Cotton">Cotton</SelectItem>
                        <SelectItem value="Georgette">Georgette</SelectItem>
                        <SelectItem value="Handloom">Handloom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select value={formData.occasion} onValueChange={(value) => setFormData(prev => ({ ...prev, occasion: value }))}>
                    <SelectTrigger className="mt-1" data-testid="product-occasion-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Festive">Festive</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1"
                      data-testid="product-price-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      required
                      min="0"
                      className="mt-1"
                      data-testid="product-stock-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., traditional, handmade, premium"
                    className="mt-1"
                    data-testid="product-tags-input"
                  />
                </div>

                <div>
                  <Label>Product Images</Label>
                  <div className="mt-2 space-y-3">
                    <div>
                      <span className="text-xs text-stone-500 font-medium block mb-1">Option 1: Upload from Computer</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        data-testid="image-upload-input"
                      />
                      {uploadingImages && <p className="text-sm text-indigo-600 mt-1">Uploading image(s)...</p>}
                    </div>

                    <div>
                      <span className="text-xs text-stone-500 font-medium block mb-1">Option 2: Add Direct Image URL</span>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="text-sm"
                          data-testid="image-url-input"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddImageUrl}
                          className="whitespace-nowrap"
                          data-testid="add-image-url-button"
                        >
                          Add URL
                        </Button>
                      </div>
                    </div>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-stone-600 mb-2">Attached Images ({formData.images.length}):</p>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative group border rounded overflow-hidden">
                            <img src={url} alt={`Product ${index + 1}`} className="w-full h-20 object-cover" />
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 bg-indigo-900/80 text-white text-[10px] px-1 py-0.5 rounded">
                                Main
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded"
                      data-testid="product-featured-checkbox"
                    />
                    <span className="text-sm text-stone-700">Featured Product</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.new_arrival}
                      onChange={(e) => setFormData(prev => ({ ...prev, new_arrival: e.target.checked }))}
                      className="rounded"
                      data-testid="product-new-arrival-checkbox"
                    />
                    <span className="text-sm text-stone-700">New Arrival</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="save-product-button">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} data-testid="cancel-button">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-stone-500">Loading products...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="products-table">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Status</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-stone-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          <div>
                            <p className="font-medium text-stone-900">{product.name}</p>
                            <p className="text-sm text-stone-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{product.category}</td>
                      <td className="px-6 py-4 font-semibold text-stone-900">₹{product.price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.stock === 0 ? 'bg-rose-100 text-rose-700' :
                          product.stock < 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {product.featured && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Featured</span>}
                          {product.new_arrival && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">New</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleEdit(product)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Pencil className="h-4 w-4 text-indigo-600" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(product.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
