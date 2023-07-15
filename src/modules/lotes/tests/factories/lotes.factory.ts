import prisma from "@/configs/database";
import addZerosEsqueda from "@/utils/addZerosEsquerda";
import { faker } from "@faker-js/faker";

export default async function factoryLote() {
  return prisma.lotes.create({
    data: {
      nome: addZerosEsqueda(faker.number.int({min: 1, max: 9999}),4)
    }
  })
}