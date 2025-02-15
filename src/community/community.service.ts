import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posts} from './posts.entity';
import { ObjectId } from 'mongodb';
import { Reply } from './reply.entity';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(Posts)
        private readonly postRepository: Repository<Posts>,

        @InjectRepository(Reply)
        private readonly replyRepository: Repository<Reply>,
    ){}


    //category: 'chats'인 게시글 전부 가져오기
    async getPostChats(): Promise<Posts[]>{
        return this.postRepository.find({
            where: {category: 'chats'},
            order: {created_at: 'DESC'},
        });
    }

    //category: 'infos'인 게시글 전부 가져오기
    async getPostInfos(): Promise<Posts[]> {
        return this.postRepository.find({
            where: {category: 'infos'},
            order: {created_at: 'DESC'},
        });
    }

    //category: 'comments'인 게시글 전부 가져오기
    async getPostComments(){
        return this.postRepository.find({
            where: {category: 'comments'},
            order: {created_at:'DESC'},
        });
    }

    async createPost(post: Partial<Posts>): Promise<Posts | null>{
        const newPost = await this.postRepository.create(post);
        return await this.postRepository.save(newPost);
    }

    //상세글 보기
    //문자열 postId를 받아서 ObjectId로 변환한 뒤 해당 게시글을 찾음
    async findPostById(postId: string) { //url 통해서 string으로 들어오니까.
        try {
            // ObjectId 변환 검증
            if (!ObjectId.isValid(postId)) {
              throw new Error('Invalid PostId format');
            }
        
            const objectId = new ObjectId(postId);
            console.log('objectId: ', objectId);
            const post = await this.postRepository.findOneBy({ _id: objectId });
            console.log('post: ', post);
        
            if (!post) {
              throw new Error('Post not found');
            }
        
            return post;
          } catch (error) {
            console.error('Error in findPostById:', error.message);
            throw error;
          }
    }
    
    async createReply(postId: string, replyData: Partial<Reply>){
        console.log('postId in createReply: ', postId);
        const post = await this.postRepository.findOne({
            where: {_id: new ObjectId(postId)},
        });

        if (!post){
            throw new Error('게시글을 찾을 수 없습니다.');
        }

        const newReply = await this.replyRepository.create({
            ...replyData,
            posts: post,
        });

        await this.replyRepository.save(newReply);

        post.replies = [...(post.replies || []), newReply];
        await this.postRepository.save(post);
        console.log('updated post in createReply: ', post);

        return newReply;
    }
}
