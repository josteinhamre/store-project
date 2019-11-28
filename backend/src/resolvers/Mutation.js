const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutations = {
    
    async createItem(parent, args, ctx, info) {
        // ToDo: Check if they are logged in
        const item = await ctx.db.mutation.createItem({
            data: {
                ...args
            }
        }, info);

        return item;
    },

    async updateItem(parent, args, ctx, info) {
        // ToDo: Check if they are logged in
        const updates = { ...args };
        delete updates.id;

        return ctx.db.mutation.updateItem(
            {
                data: updates,
                where: {
                    id: args.id,
                },
            }, 
            info
        );
    },

    async deleteItem(parent, args, ctx, info) {
        const where =  { id: args.id };
        // find the item
        const item = await ctx.db.query.item({ where }, info, `{ id, title }`);
        // check ownership of item/permissions
        // delete it
        return ctx.db.mutation.deleteItem({ where }, info);
    },

    async signup(parent, args, ctx, info) {
        args.email = args.email.toLowerCase();
        // Hash their password
        const password = await bcrypt.hash(args.password, 10);
        // Create user in DB
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER'] },
            }
        },
        info
        );
        // Create JWT token
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // Set JWT token as cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return user;
    },

    async signin(parent, { email, password }, ctx, info) {
        email = email.toLowerCase();
        const user = await ctx.db.query.user({ where: { email } });
        if(!user) {
            throw new Error(`No user found for ${email}`);
        }
        const valid = await bcrypt.compare(password, user.password)
        if(!valid) {
            throw new Error('Invalid password');
        }
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // Set JWT token as cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return user;
    },

    signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token');
        return { message: 'Goodbye!'};
    },

};

module.exports = Mutations;