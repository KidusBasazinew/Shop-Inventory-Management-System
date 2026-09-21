import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import userRouter from "./user.routes.js";
import shopRouter from "./shop.routes.js";
import productRouter from "./product.routes.js";
import supplierRouter from "./supplier.routes.js";
import purchaseRouter from "./purchase.routes.js";
import customerRouter from "./customer.routes.js";
import saleRouter from "./sale.routes.js";
import paymentRouter from "./payment.routes.js";
import expenseRouter from "./expense.routes.js";
import employeeRouter from "./employee.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/shop", shopRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/suppliers", supplierRouter);
apiRouter.use("/purchases", purchaseRouter);
apiRouter.use("/customers", customerRouter);
apiRouter.use("/sales", saleRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/expenses", expenseRouter);
apiRouter.use("/employees", employeeRouter);

export default apiRouter;
