import { api } from "./apiClient";

/**
 * Tạo menu mới
 * @param {Object} menuData
 * @returns {Promise<Object>} MenuResponse
 */
export const createMenu = async (menuData) => {
  return await api.post("/menus", menuData);
};

/**
 * Cập nhật menu
 * @param {string} menuId - UUID của menu
 * @param {Object} menuData
 * @returns {Promise<Object>} MenuResponse
 */
export const updateMenu = async (menuId, menuData) => {
  return await api.put(`/menus/${menuId}`, menuData);
};

/**
 * Xóa menu
 * @param {string} menuId - UUID của menu
 * @returns {Promise<void>}
 */
export const deleteMenu = async (menuId) => {
  return await api.delete(`/menus/${menuId}`);
};

/**
 * Lấy menu theo ID
 * @param {string} menuId - UUID của menu
 * @returns {Promise<Object>} MenuResponse
 */
export const getMenuById = async (menuId) => {
  return await api.get(`/menus/${menuId}`);
};
