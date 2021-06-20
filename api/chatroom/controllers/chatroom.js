"use strict";
const _ = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const jwt = ctx.header.authorization.slice(7);
    const userPermissionService = strapi.plugins["users-permissions"].services;
    const { id } = await userPermissionService.jwt.verify(jwt);
    const user = await userPermissionService.user.fetch({ id });
    const targetUser = await userPermissionService.user.fetch({
      email: ctx.query.targetUserEmail,
    });
    const chatroomQuery = await strapi
      .query("chatroom")
      .model.query((qb) => {
        qb.where(function () {
          this.where("user1", user.email);
          this.where("user2", targetUser.email);
        });
        qb.orWhere(function () {
          this.where("user1", targetUser.email);
          this.where("user2", user.email);
        });
      })
      .fetch();
    if (!chatroomQuery) {
      const createChatRoom = await strapi.services.chatroom.create({
        roomid: user.email + targetUser.email,
        user1: user.email,
        user2: targetUser.email,
        users_permissions_user: user.id,
      });
      return { chatroomID: createChatRoom.roomid };
    } else {
      const [existedChatroom] = await strapi
        .query("chatroom")
        .find({ id: chatroomQuery.id });
      const chatroomMessages = await strapi
        .query("chatroom-message")
        .find({ "chatroom.id": chatroomQuery.id });
      const sortedChatRoomMessages = _.sortBy(chatroomMessages, ["id"]);

      return {
        chatroomID: existedChatroom.roomid,
        chatMessages: sortedChatRoomMessages,
      };
    }
  },
};
