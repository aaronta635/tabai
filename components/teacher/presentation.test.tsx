/** @vitest-environment happy-dom */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { StudioShell } from "@/components/studio-shell";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { ClassDropList } from "@/components/teacher/class-drop-list";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";
import { renderWithIntl } from "@/test/render";
const assign = vi.hoisted(() => vi.fn(async (_input: unknown) => undefined));
vi.mock("@/app/teacher/lms-actions", () => ({ assignWork: assign, createClass: vi.fn() }));
beforeEach(() => {
 sessionStorage.setItem("howl0-session-bound", "1");
 Object.defineProperty(window,"matchMedia",{configurable:true,value:()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})});
 assign.mockClear();
});
it("teacher shell reuses material and drawer contract while keeping destinations", async () => {
 const user=userEvent.setup();
 const view=renderWithIntl(<StudioShell variant="teacher" name="Teacher A" home="/teacher" kicker="Studio" items={[{href:"/teacher/submissions",label:"Submissions",icon:"video"}]} menuLinks={[]} signOutAction={async()=>{}} labels={{menu:"Menu",close:"Close",signOut:"Sign out",themeOn:"Turn on dark mode",themeOff:"Turn off"}}><input aria-label="Unsent" defaultValue="Keep" /></StudioShell>,[]);
 expect(view.container.querySelector('.teacher-ui.student-ui')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Submissions'})).toHaveAttribute('href','/teacher/submissions');
 await user.click(screen.getByRole('button',{name:'Menu'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByRole('button',{name:'Menu'})).toHaveFocus();
 expect(screen.getByLabelText('Unsent')).toHaveValue('Keep');
});
it("class modal isolates background and restores focus", async () => {
 const user=userEvent.setup();
 renderWithIntl(<div className="student-ui teacher-ui"><CreateClassDialog /></div>,['teacher']);
 const trigger=screen.getByRole('button',{name:/Create class/i});
 await user.click(trigger);
 const dialog=screen.getByRole('dialog');
 expect(screen.getAllByRole('button',{name:/Close/i}).at(-1)).toHaveFocus();
 fireEvent.keyDown(dialog,{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull(); expect(trigger).toHaveFocus();
});
it("labelled assignment fields keep target, due date and goal payloads", async () => {
 const user=userEvent.setup();
 renderWithIntl(<AssignDialog pieceId="piece-a" classes={[{id:'class-a',name:'Class A'}]} students={[]} />,['teacher']);
 await user.click(screen.getByRole('button',{name:/^Assign/}));
 const selects=screen.getAllByRole('combobox');
 expect(selects[0]).toHaveAccessibleName();expect(selects[1]).toHaveAccessibleName();
 await user.selectOptions(selects[0],'class-a');
 const date=document.querySelector('input[name="dueAt"]') as HTMLInputElement;
 expect(date).toHaveAccessibleName();fireEvent.change(date,{target:{value:'2026-11-01'}});
 const goal=document.querySelector('input[name="goal"]') as HTMLInputElement;
 await user.type(goal,'Synthetic goal');
 await user.click(screen.getByRole('button',{name:/^Assign/}));
 await waitFor(()=>expect(assign).toHaveBeenCalledWith({pieceId:'piece-a',partId:undefined,classId:'class-a',studentId:undefined,dueAt:'2026-11-01',goal:'Synthetic goal'}));
});
it("class drop asks for a due date and does not save when the teacher cancels", async () => {
 const user=userEvent.setup();
 renderWithIntl(<ClassDropList classes={[{id:'class-a',name:'Class A'}]} />,['teacher']);
 fireEvent.drop(screen.getByTitle('Drop on Class A'),{dataTransfer:{getData:(type:string)=>type==='application/x-howl0-piece'?'piece-a':''}});
 expect(assign).not.toHaveBeenCalled();
 expect(screen.getByLabelText('Due date')).toBeRequired();
 await user.click(screen.getByRole('button',{name:'Close'}));
 expect(assign).not.toHaveBeenCalled();
 expect(screen.queryByLabelText('Due date')).toBeNull();
});
it("class drop saves only after a due date is chosen", async () => {
 const user=userEvent.setup();
 renderWithIntl(<ClassDropList classes={[{id:'class-a',name:'Class A'}]} />,['teacher']);
 fireEvent.drop(screen.getByTitle('Drop on Class A'),{dataTransfer:{getData:(type:string)=>type==='application/x-howl0-piece'?'piece-a':''}});
 fireEvent.change(screen.getByLabelText('Due date'),{target:{value:'2026-11-12'}});
 await user.click(screen.getByRole('button',{name:'Assign…'}));
 await waitFor(()=>expect(assign).toHaveBeenCalledWith({classId:'class-a',pieceId:'piece-a',partId:undefined,dueAt:'2026-11-12'}));
});
