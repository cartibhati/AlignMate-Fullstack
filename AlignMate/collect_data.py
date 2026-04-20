import cv2
import mediapipe as mp
import csv
import os

print("Starting data collection...")

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

file_name = "data.csv"

# Create file only if not exists
if not os.path.exists(file_name):
    with open(file_name, "w", newline="") as f:
        writer = csv.writer(f)
        headers = []
        for i in range(33):
            headers += [f"x{i}", f"y{i}", f"z{i}"]
        headers.append("label")
        writer.writerow(headers)
    print("✅ data.csv created")

# Open camera
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ Camera not detected")
    exit()
else:
    print("✅ Camera started")

print("Press 'c' = correct")
print("Press 'i' = incorrect")
print("Press 'q' = quit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ No frame")
        break

    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    cv2.imshow("Data Collection", frame)

    key = cv2.waitKey(1) & 0xFF

    if results.pose_landmarks:
        if key == ord('c') or key == ord('i'):
            label = "correct" if key == ord('c') else "incorrect"

            row = []
            for lm in results.pose_landmarks.landmark:
                row += [lm.x, lm.y, lm.z]

            row.append(label)

            with open(file_name, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(row)

            print(f"✅ Saved: {label}")

    if key == ord('q'):
        print("Exiting...")
        break

cap.release()
cv2.destroyAllWindows()