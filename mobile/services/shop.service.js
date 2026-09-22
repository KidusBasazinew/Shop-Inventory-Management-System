import api from "../lib/api";

export async function getShop() {
  const { data } = await api.get("/shop");
  return data;
}
