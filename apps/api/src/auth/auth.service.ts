import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateGoogleUser(profile: any): Promise<any> {
        const { id: googleId, displayName, emails, photos } = profile;
        const email = emails[0]?.value;
        const avatar = photos && photos.length > 0 ? photos[0].value : null;

        let user = await this.usersService.findByEmail(email);

        if (user) {
            if (!user.google_id && googleId) {
                user = await this.usersService.update(user.id, {
                    google_id: googleId,
                    avatar_url: avatar,
                });
            }
        } else {
            user = await this.usersService.create({
                email,
                name: displayName,
                google_id: googleId,
                avatar_url: avatar,
            });
        }
        return user;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            isAdmin: user.email === process.env.ADMIN_EMAIL,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar_url,
                isAdmin: payload.isAdmin
            }
        };
    }
}
