import api from './api';
import { AsyncHandler } from '../utils/asyncHandler';

export const shuttleCategoryService = {
    getCategories: AsyncHandler(async () => {
        const response = await api.get('/shuttle-categories');
        return response.data;
    }),

    getCategoryByName: AsyncHandler(async (name) => {
        const response = await api.get(`/shuttle-categories/name/${name}`);
        return response.data;
    })
};

export default shuttleCategoryService; 