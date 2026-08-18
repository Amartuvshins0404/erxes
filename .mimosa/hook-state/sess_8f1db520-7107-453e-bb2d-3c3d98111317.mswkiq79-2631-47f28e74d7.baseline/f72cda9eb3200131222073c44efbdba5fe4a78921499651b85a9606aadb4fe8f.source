import { useState } from 'react';
import { useForms } from '../hooks/userForms';
import { Spinner, Table, RelativeDateDisplay } from 'erxes-ui';
import { formQuestions } from '../constants/formQuestions';

export const Forms = () => {
  const { forms = [], loading } = useForms();
  const [searchText, setSearchText] = useState('');

  if (loading) return <Spinner containerClassName="py-32" />;

  const filteredForms = forms.filter(
    (f) =>
      f.email.toLowerCase().includes(searchText.toLowerCase()) ||
      f.name.toLowerCase().includes(searchText.toLowerCase()) ||
      f.phone.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by Email, Name, Phone"
          className="px-4 py-2 border rounded-lg w-full max-w-md"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[2300px] table-auto">
            <Table.Header className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10 border-b-2 border-indigo-200">
              <Table.Row>
                <Table.Head className="w-20 text-center font-bold">
                  #
                </Table.Head>
                <Table.Head className="w-80 font-bold">Email</Table.Head>
                <Table.Head className="w-64 font-bold">Name</Table.Head>
                <Table.Head className="w-56 font-bold">Phone</Table.Head>

                {formQuestions
                  .filter((q) => q.type !== 'contact')
                  .map((q) => (
                    <Table.Head key={q.id} className="px-6 py-5 text-left">
                      <div className="text-xs font-bold text-gray-800 leading-tight max-w-lg">
                        {q.question}
                      </div>
                    </Table.Head>
                  ))}

                <Table.Head className="w-56 text-right pr-10 font-bold">
                  Submitted at
                </Table.Head>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {filteredForms.map((form, index) => (
                <Table.Row
                  key={form._id ?? index}
                  className="hover:bg-indigo-50/40 transition-all border-b border-gray-100"
                >
                  <Table.Cell className="text-center font-semibold text-gray-700">
                    {index + 1}
                  </Table.Cell>

                  <Table.Cell className="font-medium text-gray-900 px-6">
                    {form.email}
                  </Table.Cell>
                  <Table.Cell className="text-gray-800 px-6">
                    {form.name}
                  </Table.Cell>
                  <Table.Cell className="text-gray-800 px-6">
                    {form.phone}
                  </Table.Cell>

                  {formQuestions
                    .filter((q) => q.type !== 'contact')
                    .map((q) => {
                      const answerKey = `answer${q.id.replace('question', '')}`;
                      const value = (form as any)[answerKey] || '—';
                      return (
                        <Table.Cell key={answerKey} className="px-6 py-5">
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium shadow-sm hover:shadow-md transition-shadow">
                            {value}
                          </span>
                        </Table.Cell>
                      );
                    })}

                  <Table.Cell className="text-right pr-10 font-medium text-gray-700">
                    <RelativeDateDisplay.Value value={form.submittedAt} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </div>
    </div>
  );
};
