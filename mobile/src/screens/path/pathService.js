import api from "../../services/api";

const pathService = {
  getAll:            (params = {}) => api.get("/path", { params }),
  getById:           (id)          => api.get(`/path/${id}`),
  getExercise:       (pathId, exerciseIndex) =>
                       api.get(`/path/${pathId}/exercise/${exerciseIndex}`),
  completeExercise:  (pathId, exerciseIndex, results) =>
                       api.post(`/path/${pathId}/exercise/${exerciseIndex}/complete`, { results }),
  getUserProgress:   (params = {}) => api.get("/path/user/progress", { params }),
  getSectionTest:    (level, sectionNum, language) =>
                       api.get("/path/section-test", { params: { level, sectionNum, language } }),
  submitSectionTest: (level, sectionNum, language, results) =>
                       api.post("/path/section-test/submit", { level, sectionNum, language, results }),
  getSectionUsers:   (level, section, language) =>
                       api.get("/path/section-users", { params: { level, section, language } }),
  bulkCreate:        (paths) => api.post("/path/bulk", { paths }),
};

export default pathService;
