import { useNewsDetail } from '../hooks/useNewsDetail';
import { useCompany } from '../hooks/useNewsDetail';
import { readImage, ScrollArea } from 'erxes-ui';
import { IconCalendar } from '@tabler/icons-react';

export const NewsDetailPreview = () => {
  const { news } = useNewsDetail();
  const { companies } = useCompany();

  const company = companies.find((c) => c._id === news?.companyId);
  const category = news?.newsAmenities?.[0]?.category;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-[400px] flex-none border-l flex flex-col overflow-hidden bg-sidebar">
      <div className="px-4 py-3 border-b">
        <p className="text-sm font-medium">Preview</p>
        <p className="text-xs text-muted-foreground">Сайт дээр ямар харагдахыг урьдчилан харах</p>
      </div>
      <ScrollArea className="flex-auto">
        <div className="p-4">
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-video overflow-hidden bg-muted">
              {category && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {category}
                  </span>
                </div>
              )}
              {news?.coverImage ? (
                <img
                  src={readImage(news.coverImage)}
                  alt={news.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Зураг байхгүй
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                {news?.name || <span className="text-muted-foreground italic font-normal text-base">Нэр байхгүй</span>}
              </h3>

              {news?.content ? (
                <div
                  className="text-muted-foreground mb-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              ) : (
                <p className="text-muted-foreground mb-4 italic text-sm">Агуулга байхгүй</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {company && (
                  <>
                    <div className="flex items-center gap-1">
                      {company.logo ? (
                        <img
                          src={readImage(company.logo)}
                          alt={company.name}
                          className="rounded-full object-contain border w-8 h-8"
                        />
                      ) : (
                        <div className="rounded-full border w-8 h-8 bg-muted flex-none" />
                      )}
                      <span className="hover:text-primary transition-colors duration-300">
                        {company.name}
                      </span>
                    </div>
                    <span>|</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <IconCalendar className="w-4 h-4" />
                  <span>{today}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
