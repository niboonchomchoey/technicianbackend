"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

module.exports = () => {
  const io = require("socket.io")(strapi.server, {
    cors: {
      origin: "*",
    },
  });
  // io.use(async (socket, next) => {
  //   const { jwt } = socket.handshake.headers;
  //   try {
  //     const userPermissionService =
  //       strapi.plugins["users-permissions"].services;
  //     const { id } = await userPermissionService.jwt.verify(jwt);
  //     const user = await userPermissionService.user.fetch({ id });
  //     socket.user = user;
  //     next();
  //   } catch (err) {
  //     next(new Error("Invalid Token"));
  //   }
  // });
  io.on("connection", (socket) => {
    const { roomId, jwt } = socket.handshake.query;
    socket.join(roomId);

    socket.on("newChatMessage", async ({ body }) => {
      const userPermissionService =
        strapi.plugins["users-permissions"].services;
      const { id } = await userPermissionService.jwt.verify(jwt);
      const user = await userPermissionService.user.fetch({ id });
      const [currentRoomId] = await strapi
        .query("chatroom")
        .find({ roomid: roomId });
      const createChatMessageResult = await strapi.services[
        "chatroom-message"
      ].create({
        message: body,
        read: false,
        chatroom: currentRoomId.id,
        users_permissions_user: user.id,
      });
      const targetUserEmail =
        user.email === currentRoomId.user1
          ? currentRoomId.user2
          : currentRoomId.user1;

      io.in(roomId).emit("newChatMessage", {
        message: createChatMessageResult.message,
        owner: createChatMessageResult.users_permissions_user.email,
        currentRoomId: roomId,
      });
      socket.broadcast.emit("broadcast", {
        targetUserEmail,
        fromUserEmail: user.email,
      });
    });
    socket.on("disconnect", () => {
      const { roomId } = socket.handshake.query;

      socket.leave(roomId);
    });
  });
};
