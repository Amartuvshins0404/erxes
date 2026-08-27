import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  DatePicker,
  Editor,
  Form,
  Input,
  Select,
  Sheet,
  Spinner,
  StringArrayInput,
  Textarea,
  Upload,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { POST_STATUS_OPTIONS } from '../constants/postConstants';
import {
  EMPTY_POST_FORM_VALUES,
  postFormSchema,
  PostFormValues,
} from '../constants/postFormSchema';
import { usePostMutations } from '../hooks/usePostMutations';
import { IPost } from '../types/post';

const toFormValues = (post?: IPost | null): PostFormValues =>
  post
    ? {
        title: post.title ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        coverImage: post.coverImage ?? '',
        tags: post.tags ?? [],
        status: post.status ?? 'draft',
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      }
    : EMPTY_POST_FORM_VALUES;

export const PostFormSheet = ({
  open,
  onOpenChange,
  post,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: IPost | null;
}) => {
  const { addPost, editPost, loading } = usePostMutations();
  const [uploadKey, setUploadKey] = useState(0);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: toFormValues(post),
  });

  const { reset } = form;

  useEffect(() => {
    if (open) {
      reset(toFormValues(post));
      setUploadKey((key) => key + 1);
    }
  }, [open, post, reset]);

  const onSubmit = (values: PostFormValues) => {
    const input = {
      ...values,
      publishedAt: values.publishedAt ? values.publishedAt.toISOString() : null,
    };

    const close = () => onOpenChange(false);

    if (post) {
      editPost(post._id, input, close);
      return;
    }

    addPost(input, close);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal>
      <Sheet.View className="sm:max-w-3xl p-0">
        <Sheet.Header>
          <Sheet.Title>{post ? 'Пост засах' : 'Пост нэмэх'}</Sheet.Title>
          <Sheet.Description className="sr-only">
            Нийтлэлийн гарчиг, агуулга, төлөвийг бөглөнө.
          </Sheet.Description>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex h-auto grow flex-col overflow-hidden">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex h-full flex-col overflow-hidden"
            >
              <div className="flex-auto space-y-5 overflow-y-auto px-6 py-4">
                <Form.Field
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Гарчиг</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Постын гарчиг" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Товч тайлбар</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          rows={2}
                          placeholder="Жагсаалт болон сайт дээр харагдах товч агуулга"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Ковер зураг</Form.Label>
                      <Form.Control>
                        <Upload.Root
                          key={uploadKey}
                          value={field.value}
                          onChange={(value) =>
                            field.onChange(
                              value && 'url' in value ? value.url : '',
                            )
                          }
                        >
                          <Upload.Preview />
                          <div className="flex flex-col gap-2">
                            <Upload.Button
                              type="button"
                              variant="secondary"
                              size="sm"
                            >
                              {field.value ? 'Солих' : 'Зураг оруулах'}
                            </Upload.Button>
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange('');
                                  setUploadKey((key) => key + 1);
                                }}
                              >
                                Устгах
                              </Button>
                            )}
                          </div>
                        </Upload.Root>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Агуулга</Form.Label>
                      <Form.Control>
                        <div className="rounded-md border p-2">
                          <Editor
                            initialContent={field.value || undefined}
                            onChange={(value: string) => field.onChange(value)}
                          />
                        </div>
                      </Form.Control>
                      <Form.Description>
                        Командын цэсийг нээхийн тулд "/" бичнэ үү.
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Шошго</Form.Label>
                      <Form.Control>
                        <StringArrayInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Шошго бичээд Enter дарна уу"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Төлөв</Form.Label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Form.Control>
                            <Select.Trigger>
                              <Select.Value />
                            </Select.Trigger>
                          </Form.Control>
                          <Select.Content>
                            {POST_STATUS_OPTIONS.map((option) => (
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="publishedAt"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Нийтлэх огноо</Form.Label>
                        <Form.Control>
                          <DatePicker
                            value={field.value ?? undefined}
                            onChange={(date) =>
                              field.onChange(date instanceof Date ? date : null)
                            }
                            placeholder="Хоосон бол нийтлэх үед автоматаар"
                            className="w-full"
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </div>

              <Sheet.Footer className="flex justify-end gap-2 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Spinner size="sm" />}
                  {post ? 'Хадгалах' : 'Үүсгэх'}
                </Button>
              </Sheet.Footer>
            </form>
          </Form>
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
};
