import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly openrouter: OpenRouter;
  private readonly logger = new Logger(AiService.name);

  // Reliable free models as fallbacks
  private readonly models = ['openrouter/owl-alpha', 'openrouter/auto'];

  constructor(private readonly prisma: PrismaService) {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getSchemaPrompt(role: string = 'ADMIN', userId?: string): string {
    let roleRestrictions = '';

    if (role === 'STUDENT') {
      roleRestrictions = `
ROLE RESTRICTIONS:
- The currently logged-in user is a STUDENT (with User ID: "${userId || 'N/A'}").
- A STUDENT is ONLY permitted to query their own information (their own attendance, schedules, fee structures, payments, enrollments).
- You MUST filter every query to only return records belonging to this student. For example, join "Student" or "User" and append a filter like "Student"."userId" = '${userId}' or "User"."id" = '${userId}'.
- If the student asks about other students, other teachers, general school metrics (like total fee collection, enrollment counts, class lists, etc.), you MUST decline the request immediately. Do NOT run the tool. Say: "As a student, you do not have permission to access this information."
`;
    } else if (role === 'TEACHER') {
      roleRestrictions = `
ROLE RESTRICTIONS:
- The currently logged-in user is a TEACHER (with User ID: "${userId || 'N/A'}").
- A TEACHER is ONLY permitted to query their own schedules, qualifications, and student attendance/enrollments in classes they teach.
- You MUST filter every query to restrict records to this teacher. For example, join "Teacher" and append a filter like "Teacher"."userId" = '${userId}'.
- If the teacher asks about general school finances, fees, salaries, other teachers' data, or administrative settings, you MUST decline the request immediately. Do NOT run the tool. Say: "As a teacher, you do not have permission to access this information."
`;
    } else {
      roleRestrictions = `
ROLE RESTRICTIONS:
- The currently logged-in user is an ADMIN.
- You have full administrative read access to all database models and school statistics.
`;
    }

    return `
You are a helpful school ERP database administrator assistant.
You have access to a read-only PostgreSQL database containing school data.

${roleRestrictions}

CRITICAL RULES:
1. NEVER output raw SQL queries, SQL code blocks (e.g. \`\`\`sql), or refer directly to technical column/table names in your final responses to the user. Always present findings in clean, natural, human-friendly language.
2. If the user asks to add, change, update, insert, delete, or modify any database records (e.g., "Change the name of...", "Update student status...", "Delete class..."), you MUST refuse politely and directly. Say: "I only have read-only access to query database information and cannot perform database modifications." Do NOT write or show any SQL UPDATE/INSERT statement for them to run.
3. If a user asks to modify records, do NOT call the "execute_readonly_query" tool. Answer directly with the refusal message.

When asked a read-only query about school statistics, records, students, classes, attendance, or fees, use the "execute_readonly_query" tool to run a SQL SELECT query.

Here is the database schema:
1. "User" (id: UUID, email: string, role: 'ADMIN'|'TEACHER'|'STUDENT', "firstName": string, "lastName": string, phone: string, "isActive": boolean)
   * Note: ALWAYS quote "firstName", "lastName", "isActive" as u."firstName", u."lastName", u."isActive". NEVER select or expose the "password" column.
2. "Student" (id: UUID, "admissionNo": string, "rollNo": string, "dateOfBirth": DateTime, gender: 'MALE'|'FEMALE'|'OTHER', "fatherName": string, "motherName": string, "emergencyContact": string, "userId": UUID)
   * Relations: user ("User".id = "userId")
   * Note: ALWAYS quote "admissionNo", "rollNo", "dateOfBirth", "fatherName", "motherName", "emergencyContact", "userId".
3. "Teacher" (id: UUID, "employeeId": string, qualification: string, gender: 'MALE'|'FEMALE'|'OTHER', "userId": UUID)
   * Relations: user ("User".id = "userId")
   * Note: ALWAYS quote "employeeId", "userId".
4. "SchoolClass" (id: UUID, name: string, section: string, "academicYearId": UUID)
5. "Enrollment" (id: UUID, "studentId": UUID, "classId": UUID, "startDate": DateTime, "endDate": DateTime)
   * Relations: student ("Student".id = "studentId"), class ("SchoolClass".id = "classId")
6. "Attendance" (id: UUID, date: Date, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED', remarks: string, "studentId": UUID, "classId": UUID)
   * Relations: student ("Student".id = "studentId"), class ("SchoolClass".id = "classId")
7. "FeeStructure" (id: UUID, "classId": UUID, title: string, amount: Decimal, mandatory: boolean)
   * Relations: class ("SchoolClass".id = "classId")
8. "StudentFee" (id: UUID, "studentId": UUID, "feeStructureId": UUID, amount: Decimal, "dueDate": DateTime, "paidAmount": Decimal, "pendingAmount": Decimal, status: 'PAID'|'PENDING'|'OVERDUE'|'PARTIAL')
   * Relations: student ("Student".id = "studentId"), feeStructure ("FeeStructure".id = "feeStructureId")
   * Note: ALWAYS quote "studentId", "feeStructureId", "dueDate", "paidAmount", "pendingAmount".
9. "Payment" (id: UUID, "studentFeeId": UUID, amount: Decimal, method: 'CASH'|'UPI'|'CARD'|'BANK_TRANSFER', "referenceNo": string, "paidAt": DateTime)
   * Relations: studentFee ("StudentFee".id = "studentFeeId")
   * Note: ALWAYS quote "studentFeeId", "referenceNo", "paidAt".
10. "Schedule" (id: UUID, "classId": UUID, "subjectId": UUID, "teacherId": UUID, "startTime": DateTime, "endTime": DateTime, room: string, "dayOfWeek": 'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY'|'SUNDAY')
   * Relations: class ("SchoolClass".id = "classId"), subject ("Subject".id = "subjectId"), teacher ("Teacher".id = "teacherId")

Rules for writing SQL:
- Only write SQL SELECT queries.
- ALWAYS quote ALL table names and ALL column names with double quotes (e.g. "StudentFee", sf."amount", sf."paidAmount", u."firstName", u."lastName", sf."status", sf."dueDate", fs."title"). PostgreSQL is strictly case-sensitive for camelCase columns and will fail with "column does not exist" errors unless you double-quote them.
- Use the EXACT column names defined in the schema. Do NOT translate camelCase columns into snake_case (e.g., write sf."paidAmount" NOT sf."paid_amount", sf."pendingAmount" NOT sf."pending_amount", s."admissionNo" NOT s."admission_no", sf."dueDate" NOT sf."due_date", s."userId" NOT s."user_id").
- Join tables using correct foreign keys. For example, to get a student's name, join "StudentFee" sf with "Student" s on sf."studentId" = s."id", then join "Student" s with "User" u on s."userId" = u."id". Do NOT join "StudentFee" directly with "User" (sf."studentId" is NOT a User ID).
- Limit raw results to a maximum of 50 rows.
- If the user asks a general question not related to ERP data, do not call the tool and just answer directly.
`;
  }

  private validateQuery(sql: string): void {
    const cleanSql = sql.trim().toLowerCase();
    if (!cleanSql.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for security.');
    }

    const forbiddenKeywords = [
      'insert', 'update', 'delete', 'drop', 'truncate', 
      'alter', 'create', 'grant', 'schema', 'password'
    ];
    for (const keyword of forbiddenKeywords) {
      if (cleanSql.includes(keyword)) {
        throw new Error(`Security Exception: Query contains forbidden keyword "${keyword}"`);
      }
    }
  }

  async askAI(prompt: string, role: string = 'ADMIN', userId?: string): Promise<string> {
    this.logger.log(`[askAI] Started with prompt: "${prompt}" (role: ${role}, userId: ${userId || 'none'})`);
    const messages: any[] = [
      {
        role: 'system' as const,
        content: this.getSchemaPrompt(role, userId),
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'execute_readonly_query',
          description: 'Execute a read-only PostgreSQL SELECT query against the ERP database to retrieve real-time school metrics.',
          parameters: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
                description: 'The PostgreSQL SELECT query to execute.',
              },
            },
            required: ['sql'],
          },
        },
      },
    ];

    for (const model of this.models) {
      let retries = 2;

      while (retries > 0) {
        try {
          const currentMessages = [...messages];
          let maxIterations = 3;
          let gotFinalResponse = false;
          let finalContent = '';

          while (maxIterations > 0 && !gotFinalResponse) {
            this.logger.log(`[askAI] Sending request to model (iteration ${4 - maxIterations}): ${model}`);
            const response = await this.openrouter.chat.send({
              chatRequest: {
                model,
                messages: currentMessages,
                tools,
                stream: false,
              },
            });

            const assistantMessage = response.choices?.[0]?.message;
            if (!assistantMessage) {
              throw new Error('Empty response');
            }

            let toolCallRequested = false;

            // 1. Check standard JSON tool calls
            if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
              toolCallRequested = true;
              currentMessages.push({
                role: 'assistant' as const,
                content: assistantMessage.content || '',
                toolCalls: assistantMessage.toolCalls,
              });

              for (const toolCall of assistantMessage.toolCalls) {
                if (toolCall.function.name.includes('execute_readonly_query')) {
                  const { sql } = JSON.parse(toolCall.function.arguments);
                  this.logger.log(`[askAI] [SQL Execution] Validating and running query: ${sql}`);

                  let resultStr = '';
                  try {
                    this.validateQuery(sql);
                    const result = await this.prisma.$queryRawUnsafe(sql);
                    this.logger.log(`[askAI] [SQL Execution Result] Retrieved raw rows: ${JSON.stringify(result, (key, value) => typeof value === 'bigint' ? Number(value) : value)}`);
                    resultStr = JSON.stringify(result, (key, value) =>
                      typeof value === 'bigint' ? Number(value) : value
                    );
                  } catch (err: any) {
                    this.logger.warn(`[askAI] SQL Query Execution failed: ${err.message}`);
                    resultStr = JSON.stringify({ error: err.message });
                  }

                  currentMessages.push({
                    role: 'tool' as const,
                    toolCallId: toolCall.id,
                    content: resultStr,
                  });
                }
              }
            }
            // 2. Check fallback XML tool calls
            else if (assistantMessage.content && /<longcat_tool_call>/i.test(assistantMessage.content)) {
              const xmlMatch = assistantMessage.content.match(/<longcat_tool_call>\s*execute_readonly_query[\s\S]*?<longcat_arg_value>([\s\S]*?)<\/longcat_arg_value>\s*<\/longcat_tool_call>/i);
              if (xmlMatch) {
                const sql = xmlMatch[1].trim();
                toolCallRequested = true;

                currentMessages.push({
                  role: 'assistant' as const,
                  content: assistantMessage.content,
                });

                this.logger.log(`[askAI] [SQL Execution] Validating and running query (XML fallback): ${sql}`);
                let resultStr = '';
                try {
                  this.validateQuery(sql);
                  const result = await this.prisma.$queryRawUnsafe(sql);
                  this.logger.log(`[askAI] [SQL Execution Result] Retrieved raw rows: ${JSON.stringify(result, (key, value) => typeof value === 'bigint' ? Number(value) : value)}`);
                  resultStr = JSON.stringify(result, (key, value) =>
                    typeof value === 'bigint' ? Number(value) : value
                  );
                } catch (err: any) {
                  this.logger.warn(`[askAI] SQL Query Execution failed: ${err.message}`);
                  resultStr = JSON.stringify({ error: err.message });
                }

                currentMessages.push({
                  role: 'user' as const,
                  content: `Database query result for "${sql}":\n${resultStr}`,
                });
              }
            }

            if (toolCallRequested) {
              maxIterations--;
              continue;
            } else {
              gotFinalResponse = true;
              finalContent = assistantMessage.content || '';
            }
          }

          if (finalContent.trim()) {
            this.logger.log(`[askAI] Final response generated: "${finalContent.trim()}"`);
            return finalContent.trim();
          }

          throw new Error('Empty response');
        } catch (err: any) {
          const statusCode = err?.status || err?.statusCode || err?.error?.code || err?.code;
          this.logger.warn(`[askAI] Model ${model} failed with status code: ${statusCode}`);

          // Retry same model if 429 (Rate Limited)
          if (statusCode === 429 && retries > 1) {
            await this.delay(1000 * Math.pow(2, 3 - retries));
            retries--;
            continue;
          }

          break; // move to next fallback model
        }
      }
    }

    this.logger.error('All AI fallback models failed');
    throw new InternalServerErrorException(
      'I am currently experiencing high load. Please try again later.',
    );
  }


  async *streamAI(prompt: string, role: string = 'ADMIN', userId?: string): AsyncGenerator<string, void, unknown> {
    this.logger.log(`[streamAI] Started with prompt: "${prompt}" (role: ${role}, userId: ${userId || 'none'})`);
    const messages: any[] = [
      {
        role: 'system' as const,
        content: this.getSchemaPrompt(role, userId),
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'execute_readonly_query',
          description: 'Execute a read-only PostgreSQL SELECT query against the ERP database to retrieve real-time school metrics.',
          parameters: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
                description: 'The PostgreSQL SELECT query to execute.',
              },
            },
            required: ['sql'],
          },
        },
      },
    ];

    for (const model of this.models) {
      let retries = 2;

      while (retries > 0) {
        try {
          const currentMessages = [...messages];
          let maxIterations = 3;
          let gotFinalResponse = false;

          while (maxIterations > 0 && !gotFinalResponse) {
            this.logger.log(`[streamAI] Sending request to model (iteration ${4 - maxIterations}): ${model}`);
            const response = await this.openrouter.chat.send({
              chatRequest: {
                model,
                messages: currentMessages,
                tools,
                stream: false,
              },
            });

            const assistantMessage = response.choices?.[0]?.message;
            if (!assistantMessage) {
              throw new Error('Empty response');
            }

            let toolCallRequested = false;

            // 1. Check standard JSON tool calls
            if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
              toolCallRequested = true;
              currentMessages.push({
                role: 'assistant' as const,
                content: assistantMessage.content || '',
                toolCalls: assistantMessage.toolCalls,
              });

              for (const toolCall of assistantMessage.toolCalls) {
                if (toolCall.function.name.includes('execute_readonly_query')) {
                  const { sql } = JSON.parse(toolCall.function.arguments);
                  this.logger.log(`[streamAI] [SQL Execution] Validating and running query: ${sql}`);

                  let resultStr = '';
                  try {
                    this.validateQuery(sql);
                    const result = await this.prisma.$queryRawUnsafe(sql);
                    this.logger.log(`[streamAI] [SQL Execution Result] Retrieved raw rows: ${JSON.stringify(result, (key, value) => typeof value === 'bigint' ? Number(value) : value)}`);
                    resultStr = JSON.stringify(result, (key, value) =>
                      typeof value === 'bigint' ? Number(value) : value
                    );
                  } catch (err: any) {
                    this.logger.warn(`[streamAI] SQL Query Execution failed: ${err.message}`);
                    resultStr = JSON.stringify({ error: err.message });
                  }

                  currentMessages.push({
                    role: 'tool' as const,
                    toolCallId: toolCall.id,
                    content: resultStr,
                  });
                }
              }
            }
            // 2. Check fallback XML tool calls
            else if (assistantMessage.content && /<longcat_tool_call>/i.test(assistantMessage.content)) {
              const xmlMatch = assistantMessage.content.match(/<longcat_tool_call>\s*execute_readonly_query[\s\S]*?<longcat_arg_value>([\s\S]*?)<\/longcat_arg_value>\s*<\/longcat_tool_call>/i);
              if (xmlMatch) {
                const sql = xmlMatch[1].trim();
                toolCallRequested = true;

                currentMessages.push({
                  role: 'assistant' as const,
                  content: assistantMessage.content,
                });

                this.logger.log(`[streamAI] [SQL Execution] Validating and running query (XML fallback): ${sql}`);
                let resultStr = '';
                try {
                  this.validateQuery(sql);
                  const result = await this.prisma.$queryRawUnsafe(sql);
                  this.logger.log(`[streamAI] [SQL Execution Result] Retrieved raw rows: ${JSON.stringify(result, (key, value) => typeof value === 'bigint' ? Number(value) : value)}`);
                  resultStr = JSON.stringify(result, (key, value) =>
                    typeof value === 'bigint' ? Number(value) : value
                  );
                } catch (err: any) {
                  this.logger.warn(`[streamAI] SQL Query Execution failed: ${err.message}`);
                  resultStr = JSON.stringify({ error: err.message });
                }

                currentMessages.push({
                  role: 'user' as const,
                  content: `Database query result for "${sql}":\n${resultStr}`,
                });
              }
            }

            if (toolCallRequested) {
              maxIterations--;
              continue;
            } else {
              gotFinalResponse = true;
              
              // No tool calls requested, we have the final answer! Stream it!
              this.logger.log(`[streamAI] Sending final response request for streaming: ${model}`);
              const streamResponse = await this.openrouter.chat.send({
                chatRequest: {
                  model,
                  messages: currentMessages,
                  stream: true,
                },
              });

              for await (const chunk of streamResponse) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              }
              return; // successfully completed streaming
            }
          }

          throw new Error('Empty response');
        } catch (err: any) {
          const statusCode = err?.status || err?.statusCode || err?.error?.code || err?.code;
          this.logger.warn(`[streamAI] Model ${model} failed with status code: ${statusCode}`);

          // Retry same model if 429 (Rate Limited)
          if (statusCode === 429 && retries > 1) {
            await this.delay(1000 * Math.pow(2, 3 - retries));
            retries--;
            continue;
          }

          break; // move to next fallback model
        }
      }
    }

    this.logger.error('All AI fallback models failed in stream mode');
    throw new InternalServerErrorException(
      'I am currently experiencing high load. Please try again later.',
    );
  }
}
