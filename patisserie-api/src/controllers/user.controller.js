import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ data: await userService.getMe(req.user.id) });
});

export const updateMe = asyncHandler(async (req, res) => {
  res.json({ data: await userService.updateMe(req.user.id, req.validated.body) });
});

export const listUsers = asyncHandler(async (req, res) => {
  res.json(await userService.listUsers(req.validated.query));
});

export const createAdmin = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await userService.createAdmin(req.validated.body) });
});
