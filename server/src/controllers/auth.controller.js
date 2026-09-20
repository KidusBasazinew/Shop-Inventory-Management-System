import catchAsync from "../utils/catchAsync.js";
import * as authService from "../services/auth.service.js";

export const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const refresh = catchAsync(async (req, res) => {
  const result = await authService.refresh(req.body);
  res.status(200).json(result);
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body);
  res.status(204).send();
});
