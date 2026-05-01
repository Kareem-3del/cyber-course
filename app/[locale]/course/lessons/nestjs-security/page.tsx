"use client";
import { LessonShell, Section, Callout, Code, Analogy, TwoCol, Card, L } from "@/components/LessonShell";

export default function Page() {
  return (
    <LessonShell slug="nestjs-security">
      <L
        ar={<>
          <Section title="ليه NestJS له فئة مخاطر خاصة؟">
            <p>NestJS framework حلو. شغل enterprise، DI، decorators، كل حاجة "magic".</p>

            <p>- طب ما هو ده اللي بيدّيله أمان أصلاً، صح؟</p>

            <p>متوقّع كالعادة يا مستجد. الـ magic ده بيخبّي إيه؟ بيخبّي إن في 6 طبقات بين الـ request والـ logic بتاعتك. كل طبقة فيهم لو اتكتبت غلط = ثغرة.</p>
            <Analogy>
              تخيّل فلتر مياه بـ 6 مراحل.
              لو واحدة منهم مكسورة والباقي شغّال، المياه بتبان نضيفة — وهي مش نضيفة.
              NestJS كده: Guard يعدّي، Pipe يفحص، Interceptor يعدّل.
              أي حلقة فيهم تخش، السلسلة كلها مكسورة وإنت مش حاسس.
              في Express لو نسيت auth middleware، بتلاقيه فوراً. في Nest لو الـ Guard مش متربّط على الـ controller، الـ endpoint مفتوح وإنت فاكره مقفول.
            </Analogy>
            <Callout kind="info" title="حكاية: ValidationPipe ناقصة = breach كامل">
              startup كاتبة <span className="eng">@Body() dto</span> من غير <span className="eng">whitelist: true</span> globally.
              المهاجم بعت <code>{`{"isAdmin": true}`}</code>. الـ ORM (TypeORM) خد الـ payload كله وحفظه.
              خلاص. الـ user بقى admin.
              مفيش 0day، مفيش APT — بس setting واحد ناقص في main.ts.
              ده اسمه Mass Assignment، ومش مشكلة Nest — مشكلة إن الناس بتثق في الـ "magic".
            </Callout>
            <Callout kind="danger" title="تحذير قانوني">
              الأمثلة دي للتدريب في المعمل بتاعك. ما تجربش على إنتاج مش بتاعك.
            </Callout>
          </Section>

          <Section title="بنية الطلب — أين يمكن أن يفشل الفحص">
            <Code lang="text">{`Request
  ↓
[Middleware]              ← Express/Fastify level (helmet, body-parser)
  ↓
[Guards]                  ← AuthGuard, RolesGuard — hasOwnProperty: استثناء = bypass
  ↓
[Interceptors (before)]   ← logging, transformation
  ↓
[Pipes]                   ← ValidationPipe, ParseIntPipe — هنا تُفحص الأنواع
  ↓
[Controller method]       ← business logic
  ↓
[Interceptors (after)]    ← serialization, response shaping
  ↓
Response`}</Code>
            <p>كل خطوة من دول نقطة فشل محتملة. Guard رمى exception غير متوقع؟ الـ filter ممكن يحوّله 500 ويسرّب stack trace. Pipe مش متربّط؟ الـ DTO هيعدّي من غير فحص أصلاً.</p>
          </Section>

          <Section title="ValidationPipe — الفخ الأشهر">
            <p>NestJS بيستخدم <span className="eng">class-validator</span>. تنسى <span className="eng">whitelist: true</span> أو <span className="eng">forbidNonWhitelisted</span>؟ المهاجم بيحقن خصايص زيادة في الـ DTO وأنت بتحفظهم في DB من غير ما تاخد بالك.</p>
            <Code lang="typescript">{`// خطر — DTO فيه isAdmin محذوف من الواجهة لكن موجود في DB
class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  // isAdmin غير معرّف هنا...
}

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.save(dto);    // ينسخ كل البيانات، بما فيها isAdmin: true
  }
}

// PoC
POST /users
{ "name": "x", "email": "x@x", "isAdmin": true }   // ⇒ admin

// الإصلاح في main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                  // أزل الخصائص غير المعرّفة
  forbidNonWhitelisted: true,       // ارفض الطلب لو فيه خصائص إضافية
  transform: true,                  // type-coerce
  transformOptions: { enableImplicitConversion: false },   // لا coerce ضمنية
  forbidUnknownValues: true
}));`}</Code>
            <Callout kind="info" title="فخ transform">
              <span className="eng">transform: true</span> + <span className="eng">enableImplicitConversion: true</span> = ضرب نار. الـ string <span className="eng">"true"</span> بيبقى boolean true. <span className="eng">"123abc"</span> ممكن يبقى 123. خلّيها <b>explicit conversion</b> دايماً.
            </Callout>
          </Section>

          <Section title="Mass assignment & DTO leakage">
            <Code lang="typescript">{`// طلب الـ entity كاملة في response؟ خطأ.
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.users.findOne(id);   // يتضمن passwordHash, mfaSecret...
}

// الإصلاح — class-transformer + ClassSerializerInterceptor
class User {
  id: number;
  email: string;

  @Exclude()
  passwordHash: string;

  @Exclude()
  mfaSecret: string;
}

// في app.module
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController { ... }

// أو DTOs منفصلة للـ response (الأفضل)
class UserResponseDto {
  @Expose() id: number;
  @Expose() email: string;
}
return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });`}</Code>
          </Section>

          <Section title="Guards bypass — أنماط شائعة">
            <Code lang="typescript">{`// Guard معتمد على property بسيطة
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.isAdmin === true;
  }
}

// مع prototype pollution سابق، req.user يرث isAdmin: true من Object.prototype
// → كل user يصبح admin

// أيضاً — Guard يقرأ من req.headers بثقة
return req.headers['x-user-id'] === req.params.id;
// المهاجم يضيف header (مع trust proxy)`}</Code>
            <Callout kind="good" title="قواعد Guards">
              <ul>
                <li>افحص بـ <span className="eng">hasOwnProperty</span> (أو <span className="eng">Object.hasOwn</span>) — مش inherited.</li>
                <li>متثقش في <span className="eng">req.user</span> إلا لو AuthGuard موثوق هو اللي حطّه.</li>
                <li>متبنيش حاجة على headers سهلة التزوير.</li>
                <li>RolesGuard: استخدم Reflector وأنت بتقرا الـ decorator، مش strings hard-coded.</li>
                <li>جرّب الـ Guard بنفسك على <span className="eng">{`{__proto__: {isAdmin: true}}`}</span> في الـ request — لو عدّى، عندك مشكلة.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="JWT في NestJS — فخاخ">
            <Code lang="typescript">{`// كثير من tutorials يكتب
JwtModule.register({ secret: 'secret' });

// خطأ — نفس الـ secret في dev و prod
// خطأ — لا تحدد algorithms (يقبل HS256 و none و RS256 → key confusion)

// الصحيح
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET,           // قوي + per-env
    signOptions: { algorithm: 'HS256', expiresIn: '15m' },
    verifyOptions: { algorithms: ['HS256'] }   // قائمة صارمة
  }),
});

// أو RS256 مع public key
JwtModule.register({
  publicKey: fs.readFileSync('public.pem'),
  privateKey: fs.readFileSync('private.pem'),
  signOptions: { algorithm: 'RS256', expiresIn: '15m' },
  verifyOptions: { algorithms: ['RS256'] }
});`}</Code>
          </Section>

          <Section title="DI Container Poisoning">
            <p>كل provider في الـ Module هو فعلياً singleton. لو حد قدر يعدّل provider في الـ runtime (نادر، بس ممكن عن طريق debugger أو unsafe eval)، هيأثر على كل الـ requests. الأشهر:</p>
            <ul>
              <li><b>Custom providers بـ <span className="eng">useValue</span></b> جايّة من user input — متعملش كده أبداً.</li>
              <li><b>Dynamic modules</b> بتقرا config من ملف — file injection بيبقى RCE على طول.</li>
              <li><b>useFactory</b> بينفّذ كود — تأكد إن المصدر موثوق.</li>
              <li><b>Request-scoped providers</b> — أبطأ، صح، بس ضروريين لـ per-request state. متستخدمش singleton لـ user data.</li>
            </ul>
          </Section>

          <Section title="Rate limiting و throttling">
            <Code lang="typescript">{`// @nestjs/throttler v5+
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})

// per-route override
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login')
login(@Body() dto: LoginDto) { ... }

// IP source — احذر trust proxy
// throttler يستخدم req.ip؛ مع trust proxy خاطئ يستطيع المهاجم تزوير IP`}</Code>
          </Section>

          <Section title="GraphQL في NestJS — surface هجوم خاصة">
            <ul>
              <li><b>Introspection</b> — مقفول في prod افتراضياً، بس كتير بينساه. <span className="eng">{`{introspection: false, playground: false}`}</span>.</li>
              <li><b>Query depth & complexity</b> — query عميقة بتوقّع السيرفر. استخدم <span className="eng">graphql-depth-limit</span> + <span className="eng">graphql-query-complexity</span>.</li>
              <li><b>Batching attacks</b> — حد يبعت 1000 query في request واحد عشان يعمل brute force. حدّها من <span className="eng">apollo-server</span> options.</li>
              <li><b>BOLA على resolvers</b> — كل resolver لازم يعيد فحص الـ ownership. متعتمدش على الـ parent resolver وخلاص.</li>
              <li><b>N+1</b> — استخدم DataLoader. غير كده، هتعمل DoS لنفسك ببلاش.</li>
            </ul>
            <Code lang="typescript">{`import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import depthLimit from 'graphql-depth-limit';
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  introspection: process.env.NODE_ENV !== 'production',
  playground: false,
  validationRules: [
    depthLimit(7),
    createComplexityRule({
      maximumComplexity: 1000,
      estimators: [simpleEstimator({ defaultComplexity: 1 })],
    }),
  ],
});`}</Code>
          </Section>

          <Section title="WebSockets / Gateways">
            <Code lang="typescript">{`// خطر — gateway بدون auth
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('msg')
  handleMessage(client: Socket, payload: any) {
    this.server.emit('msg', payload);   // broadcast لكل user
  }
}

// أي user متصل (حتى دون login) يستطيع broadcast
// PoC: socket.io-client ثم emit('msg', '<script>...</script>')

// الإصلاح
@UseGuards(WsJwtGuard)               // Guard مخصّص للـ WS
@WebSocketGateway({ cors: { origin: ['https://app.target.gov'] } })

// JWT في handshake
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.data.user = jwt.verify(token, secret);
    next();
  } catch { next(new Error('unauthorized')); }
});`}</Code>
          </Section>

          <Section title="File Upload — Multer pitfalls">
            <Code lang="typescript">{`// خطر — يقبل أي ملف
@Post('avatar')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {
  fs.writeFileSync(\`./uploads/\${file.originalname}\`, file.buffer);
  // path traversal عبر originalname: "../../etc/cron.d/x"
}

// آمن
@Post('avatar')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, \`\${randomUUID()}.\${extname(file.originalname).slice(1)}\`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/png','image/jpeg','image/webp'].includes(file.mimetype)) {
      return cb(new BadRequestException('bad mime'), false);
    }
    cb(null, true);
  },
}))
upload(@UploadedFile(new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^image\\/(png|jpeg|webp)$/ }),
  ],
})) file: Express.Multer.File) { ... }

// + content-type magic byte check (file-type lib)
// + virus scan (clamav)
// + serve من CDN منفصل، ليس من نفس origin (يمنع HTML/JS upload XSS)`}</Code>
          </Section>

          <Section title="ORM — TypeORM / Prisma injection">
            <Code lang="typescript">{`// TypeORM raw query — خطر
this.users.query(\`SELECT * FROM users WHERE id = \${req.params.id}\`);
// SQLi مباشر

// آمن — parameters
this.users.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
// أو QueryBuilder
this.users.createQueryBuilder('u').where('u.id = :id', { id }).getOne();

// Prisma — أساساً آمن، لكن $queryRawUnsafe خطر
prisma.$queryRawUnsafe(\`SELECT * FROM \${table}\`);   // SQLi
prisma.$queryRaw\`SELECT * FROM users WHERE id = \${id}\`;   // آمن (template tag)

// Prisma — extended raw filter بـ JSON
prisma.user.findMany({ where: req.body.where });   // مهاجم يضع OR / AND معقّدة
// قيّد الـ where لـ DTO معروف`}</Code>
          </Section>

          <Section title="تحصين عام — main.ts كامل">
            <Code lang="typescript">{`import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.enableCors({
    origin: ['https://app.target.gov'],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }));

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // graceful shutdown — هام لـ Kubernetes
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();`}</Code>
          </Section>

          <Section title="مراجع و أدوات">
            <ul>
              <li><b>Snyk</b> — مع Nest-aware rules.</li>
              <li><b>Semgrep</b> — قواعد nestjs مخصصة (<span className="eng">nestjs.audit</span>).</li>
              <li><b>nest-cli + ESLint security plugin</b>.</li>
              <li><b>OWASP API Security Top 10</b> — كل بند فيها بينطبق.</li>
              <li><b>Burp + Postman collection</b> — جرّب كل endpoint بـ IDOR/BOLA.</li>
              <li>كتاب "NestJS in Practice" + قسم Security من docs.nestjs.com.</li>
            </ul>
          </Section>

          <Section title="غلطات الـ junior في Nest">
            <Callout kind="danger" title="اللي بيحصل لما الـ junior يثق في الـ magic">
              <ul>
                <li><b>ValidationPipe على controller واحد بس</b> — والباقي مفتوح. اعملها global في main.ts.</li>
                <li><b>@UseGuards على method، مش على class</b> — وبعدين بتضيف method جديد وتنسى الـ guard. اخلّيها على الـ class.</li>
                <li><b>JWT secret في @Module constructor</b> — مش في Vault ولا KMS. بيتسرّب أول ما الـ source code يطلع.</li>
                <li><b>Custom Decorator بياخد user من request</b> — من غير ما يتأكد إن الـ user authenticated. الـ decorator نفسه ممكن يكون الثغرة.</li>
                <li><b>RolesGuard بـ @SetMetadata('roles', ['admin'])</b> — بس مفيش default deny. لو نسيت تحط الـ decorator، الـ endpoint مفتوح للكل.</li>
                <li><b>Exception filter بيرجّع stack trace</b> — في production. الـ attacker شاكر.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="الخلاصة الناشفة">
            <p>NestJS مش "أكثر أماناً من Express" — هو بس "أكثر تنظيماً".</p>
            <p>التنظيم بيدّيك مكان واحد تحط الحماية فيه (global pipes، global guards، global filters). بس لازم تحطها فعلاً.</p>
            <p>الـ magic بتاع DI بيخفي الأخطاء، فمحدش بيلاحظها لحد ما تطلع breach في تويتر.</p>
            <p>اكتبها على كشكولك:</p>
            <p>Default deny. Whitelist everything. والـ class-validator على كل DTO. اوعى تستثني واحد.</p>
          </Section>
        </>}
        en={<>
          <Section title="Why NestJS has its own risk class">
            <p>NestJS layers <b>Decorators, DI Container, Guards, Pipes, Interceptors, Modules</b> on top of Express/Fastify. Each layer has its own way to be wrong, opening vulnerabilities you don't get in raw Express. The strength is the weakness: the "magic" hides what actually runs.</p>
            <Analogy>A multi-stage water filter. If one stage is broken and the others work, the water looks clean — but it isn't. NestJS is similar: Guard passes, Pipe checks, Interceptor transforms — break any link and the whole chain fails.</Analogy>
            <Callout kind="danger" title="Legal warning">
              Examples are for your own lab. Don't test against production you don't own.
            </Callout>
          </Section>

          <Section title="Request lifecycle — where validation can fail">
            <Code lang="text">{`Request
  ↓
[Middleware]              ← Express/Fastify level (helmet, body-parser)
  ↓
[Guards]                  ← AuthGuard, RolesGuard — silent throw = bypass
  ↓
[Interceptors (before)]   ← logging, transformation
  ↓
[Pipes]                   ← ValidationPipe, ParseIntPipe — types check here
  ↓
[Controller method]       ← business logic
  ↓
[Interceptors (after)]    ← serialization, response shaping
  ↓
Response`}</Code>
            <p>Every step is a potential failure point. If a Guard throws an unexpected exception, the global filter may convert it to 500 leaking a stack trace. If a Pipe isn't bound, the DTO arrives unvalidated.</p>
          </Section>

          <Section title="ValidationPipe — the most-hit trap">
            <p>NestJS uses <span className="eng">class-validator</span>. Forget <span className="eng">whitelist: true</span> or <span className="eng">forbidNonWhitelisted</span> and the attacker injects extra fields.</p>
            <Code lang="typescript">{`// Vulnerable — DTO doesn't list isAdmin, but the entity does
class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  // isAdmin is not here...
}

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.save(dto);    // copies all fields including isAdmin: true
  }
}

// PoC
POST /users
{ "name": "x", "email": "x@x", "isAdmin": true }   // ⇒ admin

// Fix — main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                  // strip undefined props
  forbidNonWhitelisted: true,       // reject if extras present
  transform: true,                  // type-coerce
  transformOptions: { enableImplicitConversion: false },   // no implicit
  forbidUnknownValues: true
}));`}</Code>
            <Callout kind="info" title="Transform trap">
              <span className="eng">transform: true</span> + <span className="eng">enableImplicitConversion: true</span> is dangerous. The string <span className="eng">"true"</span> becomes boolean true. <span className="eng">"123abc"</span> can become 123. Always use <b>explicit conversion</b>.
            </Callout>
          </Section>

          <Section title="Mass assignment & DTO leakage">
            <Code lang="typescript">{`// Returning the entity directly? Bad.
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.users.findOne(id);   // includes passwordHash, mfaSecret...
}

// Fix — class-transformer + ClassSerializerInterceptor
class User {
  id: number;
  email: string;

  @Exclude()
  passwordHash: string;

  @Exclude()
  mfaSecret: string;
}

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController { ... }

// Or separate response DTOs (preferred)
class UserResponseDto {
  @Expose() id: number;
  @Expose() email: string;
}
return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });`}</Code>
          </Section>

          <Section title="Guard bypass — common patterns">
            <Code lang="typescript">{`// Guard relying on a simple property
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.isAdmin === true;
  }
}

// With upstream prototype pollution, req.user inherits isAdmin: true from Object.prototype
// → every user becomes admin

// Also — Guard trusting headers
return req.headers['x-user-id'] === req.params.id;
// Attacker sets the header (especially with bad trust proxy)`}</Code>
            <Callout kind="good" title="Guard rules">
              <ul>
                <li>Use <span className="eng">hasOwnProperty</span> (or <span className="eng">Object.hasOwn</span>), not inherited lookups.</li>
                <li>Trust <span className="eng">req.user</span> only if a verified AuthGuard set it.</li>
                <li>Never trust forge-able headers.</li>
                <li>RolesGuard: use Reflector to read the decorator, not hard-coded strings.</li>
                <li>Test the guard with <span className="eng">{`{__proto__: {isAdmin: true}}`}</span> in the request.</li>
              </ul>
            </Callout>
          </Section>

          <Section title="JWT in NestJS — pitfalls">
            <Code lang="typescript">{`// Many tutorials write
JwtModule.register({ secret: 'secret' });

// Wrong — same secret across dev and prod
// Wrong — no algorithm pin (HS256 and none and RS256 accepted → key confusion)

// Right
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET,           // strong + per-env
    signOptions: { algorithm: 'HS256', expiresIn: '15m' },
    verifyOptions: { algorithms: ['HS256'] }   // strict allowlist
  }),
});

// Or RS256 with a public key
JwtModule.register({
  publicKey: fs.readFileSync('public.pem'),
  privateKey: fs.readFileSync('private.pem'),
  signOptions: { algorithm: 'RS256', expiresIn: '15m' },
  verifyOptions: { algorithms: ['RS256'] }
});`}</Code>
          </Section>

          <Section title="DI container poisoning">
            <p>Each provider in a module is effectively a singleton. If an attacker can mutate a provider at runtime (rare but possible via debugger / unsafe eval), every request is affected. Most common pitfalls:</p>
            <ul>
              <li><b>Custom providers using <span className="eng">useValue</span></b> with user input — never do this.</li>
              <li><b>Dynamic modules</b> reading config from a file — file injection becomes RCE.</li>
              <li><b>useFactory</b> runs code — make sure the source is trustworthy.</li>
              <li><b>Request-scoped providers</b> — slower, but required for per-request state. Don't use singleton scope for user data.</li>
            </ul>
          </Section>

          <Section title="Rate limiting & throttling">
            <Code lang="typescript">{`// @nestjs/throttler v5+
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})

// per-route override
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login')
login(@Body() dto: LoginDto) { ... }

// IP source — beware trust proxy
// Throttler keys on req.ip; misconfigured trust proxy lets attackers forge IPs`}</Code>
          </Section>

          <Section title="GraphQL in NestJS — its own attack surface">
            <ul>
              <li><b>Introspection</b> — disabled in prod by default, but many forget. <span className="eng">{`{introspection: false, playground: false}`}</span>.</li>
              <li><b>Query depth & complexity</b> — deep queries can DoS. Use <span className="eng">graphql-depth-limit</span> + <span className="eng">graphql-query-complexity</span>.</li>
              <li><b>Batching attacks</b> — 1000 queries in one request used to brute-force. Cap via <span className="eng">apollo-server</span> options.</li>
              <li><b>BOLA at resolvers</b> — every resolver re-checks ownership. Don't trust the parent resolver.</li>
              <li><b>N+1</b> — use DataLoader. Otherwise it's a free DoS.</li>
            </ul>
            <Code lang="typescript">{`import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import depthLimit from 'graphql-depth-limit';
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  introspection: process.env.NODE_ENV !== 'production',
  playground: false,
  validationRules: [
    depthLimit(7),
    createComplexityRule({
      maximumComplexity: 1000,
      estimators: [simpleEstimator({ defaultComplexity: 1 })],
    }),
  ],
});`}</Code>
          </Section>

          <Section title="WebSockets / Gateways">
            <Code lang="typescript">{`// Vulnerable — gateway with no auth
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('msg')
  handleMessage(client: Socket, payload: any) {
    this.server.emit('msg', payload);   // broadcast to every user
  }
}

// Any connected client (even un-logged-in) can broadcast
// PoC: socket.io-client then emit('msg', '<script>...</script>')

// Fix
@UseGuards(WsJwtGuard)               // dedicated WS guard
@WebSocketGateway({ cors: { origin: ['https://app.target.gov'] } })

// JWT during handshake
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.data.user = jwt.verify(token, secret);
    next();
  } catch { next(new Error('unauthorized')); }
});`}</Code>
          </Section>

          <Section title="File upload — Multer pitfalls">
            <Code lang="typescript">{`// Vulnerable — accepts anything
@Post('avatar')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {
  fs.writeFileSync(\`./uploads/\${file.originalname}\`, file.buffer);
  // path traversal via originalname: "../../etc/cron.d/x"
}

// Safe
@Post('avatar')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, \`\${randomUUID()}.\${extname(file.originalname).slice(1)}\`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/png','image/jpeg','image/webp'].includes(file.mimetype)) {
      return cb(new BadRequestException('bad mime'), false);
    }
    cb(null, true);
  },
}))
upload(@UploadedFile(new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^image\\/(png|jpeg|webp)$/ }),
  ],
})) file: Express.Multer.File) { ... }

// + content-type magic-byte check (file-type lib)
// + virus scan (clamav)
// + serve from a separate CDN (no shared origin → no HTML/JS upload XSS)`}</Code>
          </Section>

          <Section title="ORM — TypeORM / Prisma injection">
            <Code lang="typescript">{`// TypeORM raw query — vulnerable
this.users.query(\`SELECT * FROM users WHERE id = \${req.params.id}\`);
// direct SQLi

// Safe — parameters
this.users.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
// Or QueryBuilder
this.users.createQueryBuilder('u').where('u.id = :id', { id }).getOne();

// Prisma — safe by default, but $queryRawUnsafe is dangerous
prisma.$queryRawUnsafe(\`SELECT * FROM \${table}\`);   // SQLi
prisma.$queryRaw\`SELECT * FROM users WHERE id = \${id}\`;   // safe (tagged template)

// Prisma — extended raw filter via JSON body
prisma.user.findMany({ where: req.body.where });   // attacker crafts complex OR/AND
// Restrict where to a known DTO`}</Code>
          </Section>

          <Section title="Hardening main.ts — full template">
            <Code lang="typescript">{`import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.enableCors({
    origin: ['https://app.target.gov'],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }));

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // graceful shutdown — important on Kubernetes
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();`}</Code>
          </Section>

          <Section title="References & tooling">
            <ul>
              <li><b>Snyk</b> — Nest-aware rules.</li>
              <li><b>Semgrep</b> — custom nestjs rules (<span className="eng">nestjs.audit</span>).</li>
              <li><b>nest-cli + ESLint security plugin</b>.</li>
              <li><b>OWASP API Security Top 10</b> — every item applies.</li>
              <li><b>Burp + Postman collections</b> — hit every endpoint with IDOR/BOLA.</li>
              <li>"NestJS in Practice" + the Security section of docs.nestjs.com.</li>
            </ul>
          </Section>
        </>}
      />
    </LessonShell>
  );
}
