import csv
import time
import os

class PostureLogger:
    def __init__(self, filename="posture_log.csv"):
        self.filename = filename
        self.file_exists = os.path.isfile(filename)

        self.file = open(self.filename, mode="a", newline="")
        self.writer = csv.writer(self.file)

        # Write header only once
        if not self.file_exists:
            self.writer.writerow([
                "timestamp",
                "neck_angle",
                "shoulder_diff",
                "neck_tilt",
                "shoulder_slouch",
                "posture_label"
            ])

    def log(self, neck_angle, shoulder_diff, neck_tilt, shoulder_slouch, posture_label):

        self.writer.writerow([
            time.time(),
            round(neck_angle, 2),
            round(shoulder_diff, 4),
            int(neck_tilt),
            int(shoulder_slouch),
            posture_label
        ])


    def close(self):
        self.file.close()
