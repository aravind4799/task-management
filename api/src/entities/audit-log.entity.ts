import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // e.g., 'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'LOGIN'

  @Column()
  resourceType: string; // e.g., 'task', 'user', 'organization'

  @Column({ nullable: true })
  resourceId: string; // ID of the resource that was acted upon

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text', { nullable: true })
  details: string; // JSON string with additional details

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
