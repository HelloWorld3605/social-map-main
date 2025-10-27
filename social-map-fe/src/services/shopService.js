import { api } from "./apiClient";

/**
 * Tạo mới cửa hàng
 * @param {Object} shopData
 * @returns {Promise<Object>} ShopResponse
 */
export const createShop = async (shopData) => {
  return await api.post("/shops", shopData);
};

/**
 * Cập nhật cửa hàng
 * @param {string} shopId - UUID của shop
 * @param {Object} shopData
 * @returns {Promise<Object>} ShopResponse
 */
export const updateShop = async (shopId, shopData) => {
  return await api.put(`/shops/${shopId}`, shopData);
};

/**
 * Xóa cửa hàng
 * @param {string} shopId - UUID của shop
 * @returns {Promise<void>}
 */
export const deleteShop = async (shopId) => {
  return await api.delete(`/shops/${shopId}`);
};

/**
 * Lấy cửa hàng theo ID
 * @param {string} shopId - UUID của shop
 * @returns {Promise<Object>} ShopResponse
 */
export const getShopById = async (shopId) => {
  return await api.get(`/shops/${shopId}`);
};

/**
 * Lấy tất cả cửa hàng
 * @returns {Promise<Array>} Danh sách ShopResponse
 */
export const getAllShops = async () => {
  return await api.get("/shops");
};
