import { ArrowUpOutlined } from "@ant-design/icons";
import { Button, Flex, Space, Typography } from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown, { Options } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { api } from "../../api";
import { Message } from "../../api/chat/types";
import { WithLoader } from "../../components/WithLoader/WithLoader";
import { UserContext } from "../../providers/UserProvider";

const options: Readonly<Options> = {
  rehypePlugins: [
    rehypeRaw,
    rehypeSanitize,
  ],
  remarkPlugins: [
    remarkGfm,
    remarkParse,
  ],
}

const messagesPerPage = 20;

export const ChatPage = () => {
  const { user } = useContext(UserContext)

  const [input, setInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, _setPage] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appendMessage = (message: Message) => {
    setMessages((prev) => {
      const current = [...prev];

      if (prev.length >= messagesPerPage * 2) {
        current.shift();
        current.shift();
      }

      current.push(message);

      return current;
    })
  }

  const loadPage = async (userId: string, page: number): Promise<void> => {
    setIsLoading(true);
    const data = await api.chat.messages(userId, page);
    const messages = data.entries.reverse().flatMap(entry => entry.messages.reverse());

    setMessages(messages);
    setIsLoading(false);
  }

  const sendMessage = async (userId: string, message: string) => {
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    } satisfies Message;

    appendMessage(userMessage);
    appendMessage(await api.chat.sendMessage(userId, message));
  }

  const scrollBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }

  // Первичная загрузка истории
  useEffect(() => {
    if (user && !messages.length) {
      loadPage(user, page)
    }
  }, [messages.length, page, user])

  // Прокрутка к последнему сообщению при изменении массива сообщений
  useEffect(() => {
    scrollBottom()
  }, [messages]);

  // Автоматическое изменение высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (user) {
      setInput('');
      await sendMessage(user, input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <WithLoader loading={isLoading} msMax={300}>
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        {/* Контейнер сообщений */}
        <div
          ref={messagesContainerRef}
          style={{
            width: '100%',
            height: 'calc(100% - 165px)',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            padding: '0 17.5% 30px 17.5%'
          }}
        >
          <Flex vertical>
            {messages.map((msg, index) => {
              return (
                <div key={index} style={{
                  padding: '5px 16px',
                  width: '100%',
                }}>
                  {msg.role === 'assistant' && (
                    <Flex vertical align='flex-start' justify='center'>
                      <p
                        style={{
                          margin: '0',
                          wordBreak: 'break-word',
                        }}
                      >
                          <div className="react-markdown-html">
                            <ReactMarkdown {...options}>{msg.content}</ReactMarkdown>
                          </div>
                      </p>
                      <Typography.Text
                        type="secondary"
                        style={{
                          fontSize: 10,
                        }}
                      >
                        {new Date(msg.timestamp!).toLocaleTimeString()}
                      </Typography.Text>
                    </Flex>
                  )}
                  {msg.role === 'user' && (
                    <Flex vertical align='flex-end' justify='center' gap={3}>
                      <p
                        style={{
                          margin: '0',
                          padding: '12px 22px',
                          maxWidth: '70%',
                          minWidth: '100px',
                          borderRadius: 20,
                          backgroundColor: '#F4F4F4',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </p>
                      <Typography.Text
                        type="secondary"
                        style={{
                          fontSize: 10,
                          marginRight: '15px',
                        }}
                      >
                        {new Date(msg.timestamp!).toLocaleTimeString()}
                      </Typography.Text>
                    </Flex>
                  )}
                </div>
              )
            })}
          </Flex>
        </div>

        {/* Форма отправки сообщений */}
        <div
          style={{
            zIndex: 10,
            width: '65%',
            position: 'absolute',
            left: '17.5%',
            transition: 'all 0.5s',
            ...(!messages.length && {
              bottom: '45%',
            }),
            ...(messages.length && {
              bottom: '5%',
            }),
          }}
        >
          <Space direction='vertical' size={5} style={{ display: 'flex', width: '100%' }}>
            {messages.length === 0 && (
              <Flex justify='center'>
                <Typography.Title level={3}>Чем я могу помочь?</Typography.Title>
              </Flex>
            )}

            <div style={{
              backgroundColor: 'white',
              borderRadius: 30,
              boxShadow: '0 5px 30px 0 rgba(0, 0, 0, 0.10)',
              padding: '10px'
            }}>
              <Space direction='vertical' size={5} style={{ display: 'flex' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Спросите что-нибудь..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    width: '96%',
                    minHeight: '10px',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    margin: '7px 2%'
                  }}
                />
                <Flex justify='flex-end' align="center" style={{ padding: '5px' }}>
                  <Button
                    type='primary'
                    shape='circle'
                    icon={<ArrowUpOutlined />}
                    onClick={handleSendMessage}
                    style={{ backgroundColor: '#6253e1' }}
                  />
                </Flex>
              </Space>
            </div>
          </Space>
        </div>
      </div>
    </WithLoader>
  );
};