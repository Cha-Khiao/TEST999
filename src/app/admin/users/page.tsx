'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Badge, Card, Spinner, Modal, Form } from 'react-bootstrap';
import { PersonPlusFill, KeyFill, Trash, PencilSquare, ShieldLockFill, EyeFill, EyeSlashFill } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false); // Edit Name & Password Modal
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Forms
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'staff' });
    const [editForm, setEditForm] = useState({ name: '', password: '' });
    const [showPassword, setShowPassword] = useState(false); // Toggle visibility

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            Swal.fire('สำเร็จ', 'เพิ่มผู้ใช้งานแล้ว', 'success');
            setShowAdd(false);
            setNewUser({ username: '', password: '', name: '', role: 'staff' });
            fetchUsers();
        } else {
            const data = await res.json();
            Swal.fire('ผิดพลาด', data.error, 'error');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        const body: any = { id: selectedUser._id };
        if (editForm.name) body.newName = editForm.name;
        if (editForm.password) body.newPassword = editForm.password;

        const res = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
            setShowEdit(false);
            setEditForm({ name: '', password: '' });
            fetchUsers();
        } else {
            Swal.fire('ผิดพลาด', 'ไม่สามารถแก้ไขได้', 'error');
        }
    };

    const handleDelete = async (user: any) => {
        const result = await Swal.fire({
            title: `ลบคุณ ${user.name}?`,
            text: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบผู้ใช้'
        });

        if (result.isConfirmed) {
            const res = await fetch(`/api/users?id=${user._id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('ลบสำเร็จ', '', 'success');
                fetchUsers();
            } else {
                const data = await res.json();
                Swal.fire('ลบไม่ได้', data.error, 'error');
            }
        }
    };

    const openEditModal = (u: any) => {
        setSelectedUser(u);
        setEditForm({ name: u.name, password: '' });
        setShowPassword(false);
        setShowEdit(true);
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">👥 จัดการผู้ใช้งาน</h3>
                    <p className="text-muted mb-0">เพิ่มลดทีมงานและกำหนดสิทธิ์การเข้าถึง</p>
                </div>
                <Button variant="primary" onClick={() => setShowAdd(true)} className="d-flex align-items-center gap-2 shadow-sm">
                    <PersonPlusFill /> เพิ่มผู้ใช้งาน
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
                        <Table hover className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">ชื่อ-สกุล</th>
                                    <th>Username</th>
                                    <th>ตำแหน่ง</th>
                                    <th>วันที่สร้าง</th>
                                    <th className="text-end pe-4">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td className="ps-4 fw-bold">{u.name}</td>
                                        <td>{u.username}</td>
                                        <td>
                                            <Badge bg={u.role === 'admin' ? 'danger' : 'success'}>
                                                {u.role.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="text-muted small">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="text-end pe-4">
                                            <Button size="sm" variant="light" className="text-primary me-1" title="แก้ไข" onClick={() => openEditModal(u)}>
                                                <PencilSquare />
                                            </Button>
                                            <Button size="sm" variant="light" className="text-danger" title="ลบ" onClick={() => handleDelete(u)}>
                                                <Trash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal: Add User */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                <Form onSubmit={handleCreate}>
                    <Modal.Header closeButton>
                        <Modal.Title>เพิ่มผู้ใช้งานใหม่</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อ-นามสกุล</Form.Label>
                            <Form.Control required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                            <Form.Control required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                            <div className="input-group">
                                <Form.Control required type={showPassword ? "text" : "password"} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeSlashFill /> : <EyeFill />}
                                </Button>
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ตำแหน่ง</Form.Label>
                            <Form.Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="staff">Staff (เจ้าหน้าที่ทั่วไป)</option>
                                <option value="admin">Admin (ผู้ดูแลระบบสูงสุด)</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
                        <Button variant="primary" type="submit">บันทึก</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal: Edit User (Name & Password) */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Form onSubmit={handleUpdateUser}>
                    <Modal.Header closeButton>
                        <Modal.Title>แก้ไขผู้ใช้งาน</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3 text-center text-muted small">
                            แก้ไขข้อมูลของ: <strong>{selectedUser?.username}</strong>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อ-นามสกุล</Form.Label>
                            <Form.Control required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </Form.Group>
                        <hr className="my-3" />
                        <Form.Group className="mb-3">
                            <Form.Label>เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</Form.Label>
                            <div className="input-group">
                                <Form.Control
                                    placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยน"
                                    type={showPassword ? "text" : "password"}
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                />
                                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeSlashFill /> : <EyeFill />}
                                </Button>
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
                        <Button variant="primary" type="submit">บันทึกการแก้ไข</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
