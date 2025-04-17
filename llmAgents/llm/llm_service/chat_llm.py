import openai
from datetime import datetime
from llmAgents.database.mongodb.chat_history import ChatHistoryConnector
from dotenv import load_dotenv
import os

load_dotenv()

class ChatGPTService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.openai_api_key
        self.model = "gpt-4o-mini"
        self.history_connector = None

    async def setup_history_connector(self, uri: str, db_name: str):
        self.history_connector = ChatHistoryConnector(uri, db_name)
        await self.history_connector.connect()

    async def close_history_connector(self):
        if self.history_connector:
            await self.history_connector.close()
            self.history_connector = None

    async def send_message(self, user_id: str, message: str) -> str:
        try:
            client = openai.OpenAI(
                api_key=self.openai_api_key
            )

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": (
                        "Ты de-fi финансовый ассистент.",
                        "Твоя задача общаться только на темы связанные с финансами, функционалом приложения, криптовалютами и инвестиционными предложениями"
                        '''
Ваша задача - определить, можно ли выполнить запрос пользователя с помощью доступных функций.
Доступные функции:
1) portfolio() - получение баланса активов юзера, подключенных кошельков к приложению(/портфолио, монеты, активы) аккаунта юзера.
Если для ответа на вопроса необходимо 
2) pools()
Формат ответа должен быть строго JSON:
{{"function": "имя_функции", "parameters": {{"параметр1": "значение1", "параметр2": "значение2"}}}}
Если действие невозможно выполнить, верните: {{}}
                        '''
                    )},
                    {"role": "user", "content": message}
                ]
            )

            assistant_reply = response.choices[0].message.content.strip()

        except Exception as e:
            raise Exception(f"OpenAI API error: {e}")

        if self.history_connector:
            chat_entry = {
                "user_id": user_id,
                "messages": [
                    {"role": "user", "content": message, "timestamp": datetime.utcnow()},
                    {"role": "assistant", "content": assistant_reply, "timestamp": datetime.utcnow()}
                ]
            }
            await self.history_connector.insert_chat_entry(chat_entry)

        return assistant_reply
