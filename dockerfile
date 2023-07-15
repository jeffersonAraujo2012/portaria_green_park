FROM node:18.15

WORKDIR /usr/src

COPY . .

RUN npm i

RUN chmod 777 ./wait-for-it.sh

CMD ["bash", "-c", "./wait-for-it.sh database:5432 -- npx prisma migrate dev && npm run seed && npm run dev"]