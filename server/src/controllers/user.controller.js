import catchAsync from "../utils/catchAsync.js";
import * as userService from "../services/user.service.js";

export const list = catchAsync(async (req, res) => {
  const users = await userService.listUsers(req.shopId);
  res.status(200).json(users);
});

export const create = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.shopId, req.body);
  res.status(201).json(user);
});

export const update = catchAsync(async (req, res) => {
  const user = await userService.updateUser(
    req.shopId,
    req.params.id,
    req.user.userId,
    req.body,
  );
  res.status(200).json(user);
});

export const deactivate = catchAsync(async (req, res) => {
  await userService.deactivateUser(
    req.shopId,
    req.params.id,
    req.user.userId,
  );
  res.status(204).send();
});
